from fastapi import APIRouter, Header, HTTPException
from typing import Optional
from supabase_helper import get_user_search_history, get_user_scrape_history
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors
from io import BytesIO
from fastapi.responses import StreamingResponse
import json

router = APIRouter()

@router.get("/api/history/people")
async def get_people_history(
    x_user_id: Optional[str] = Header(None),
    limit: int = 50
):
    """Get user's people search history"""
    if not x_user_id:
        raise HTTPException(status_code=401, detail="User ID required")
    
    try:
        history = get_user_search_history(x_user_id, limit)
        return {"success": True, "data": history}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/history/property")
async def get_property_history(
    x_user_id: Optional[str] = Header(None),
    limit: int = 50
):
    """Get user's property scrape history"""
    if not x_user_id:
        raise HTTPException(status_code=401, detail="User ID required")
    
    try:
        history = get_user_scrape_history(x_user_id, limit)
        return {"success": True, "data": history}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/api/history/{item_type}/{item_id}")
async def delete_history_item(
    item_type: str,
    item_id: str,
    x_user_id: Optional[str] = Header(None)
):
    """Delete a history item"""
    if not x_user_id:
        raise HTTPException(status_code=401, detail="User ID required")
    
    try:
        from supabase_helper import get_supabase
        supabase = get_supabase()
        if not supabase:
            raise HTTPException(status_code=500, detail="Database not initialized")
        
        table = "people_searches" if item_type == "people" else "property_scrapes"
        result = supabase.table(table).delete().eq("id", item_id).eq("user_id", x_user_id).execute()
        
        return {"success": True, "message": "Item deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/history/export/{item_type}/{item_id}")
async def export_to_pdf(
    item_type: str,
    item_id: str,
    x_user_id: Optional[str] = Header(None)
):
    """Export history item to PDF"""
    if not x_user_id:
        raise HTTPException(status_code=401, detail="User ID required")
    
    try:
        from supabase_helper import get_supabase
        supabase = get_supabase()
        if not supabase:
            raise HTTPException(status_code=500, detail="Database not initialized")
        
        table = "people_searches" if item_type == "people" else "property_scrapes"
        result = supabase.table(table).select("*").eq("id", item_id).eq("user_id", x_user_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Item not found")
        
        item = result.data[0]
        
        # Create PDF
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        styles = getSampleStyleSheet()
        story = []
        
        # Title
        title = Paragraph(f"<b>{item_type.title()} Search Report</b>", styles['Title'])
        story.append(title)
        story.append(Spacer(1, 12))
        
        # Metadata
        meta_data = [
            ["Query:", item.get('search_query', item.get('property_url', 'N/A'))],
            ["Date:", item['created_at']],
            ["Status:", item['status']],
            ["Source:", item.get('source', 'N/A')]
        ]
        meta_table = Table(meta_data, colWidths=[100, 400])
        meta_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.grey),
            ('TEXTCOLOR', (0, 0), (0, -1), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        story.append(meta_table)
        story.append(Spacer(1, 20))
        
        # Results
        results = item.get('results', item.get('property_data', {}))
        if results:
            story.append(Paragraph("<b>Results:</b>", styles['Heading2']))
            story.append(Spacer(1, 12))
            
            results_text = json.dumps(results, indent=2)
            story.append(Paragraph(f"<pre>{results_text}</pre>", styles['Code']))
        
        doc.build(story)
        buffer.seek(0)
        
        return StreamingResponse(
            buffer,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={item_type}_{item_id}.pdf"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/usage/storage")
async def get_storage_usage(x_user_id: Optional[str] = Header(None)):
    """Get user's storage usage and limits"""
    if not x_user_id:
        raise HTTPException(status_code=401, detail="User ID required")
    
    try:
        from supabase_helper import get_supabase
        supabase = get_supabase()
        if not supabase:
            raise HTTPException(status_code=500, detail="Database not initialized")
        
        # Calculate storage from history items
        people_result = supabase.table("people_searches").select("results").eq("user_id", x_user_id).execute()
        property_result = supabase.table("property_scrapes").select("property_data").eq("user_id", x_user_id).execute()
        
        total_bytes = 0
        for item in people_result.data:
            if item.get('results'):
                total_bytes += len(json.dumps(item['results']).encode('utf-8'))
        
        for item in property_result.data:
            if item.get('property_data'):
                total_bytes += len(json.dumps(item['property_data']).encode('utf-8'))
        
        # Storage limits by tier
        limits = {
            "free": 100 * 1024 * 1024,  # 100MB
            "pro": 5 * 1024 * 1024 * 1024,  # 5GB
            "enterprise": float('inf')
        }
        
        # TODO: Get user's actual tier from database
        user_tier = "free"
        limit = limits[user_tier]
        
        return {
            "success": True,
            "data": {
                "used_bytes": total_bytes,
                "used_mb": round(total_bytes / (1024 * 1024), 2),
                "limit_bytes": limit if limit != float('inf') else None,
                "limit_mb": round(limit / (1024 * 1024), 2) if limit != float('inf') else None,
                "tier": user_tier,
                "percentage": round((total_bytes / limit) * 100, 2) if limit != float('inf') else 0
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
