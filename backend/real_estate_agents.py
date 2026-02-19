"""
Real Estate AI Agent – CrewAI + Bright Data MCP.
Accepts a listing URL and returns structured property JSON.
"""
# Disable CrewAI telemetry when running inside threaded servers (uvicorn --reload, dev tools)
# to avoid "signal only works in main thread" tracebacks printed during import.
import os
os.environ.setdefault("CREWAI_DISABLE_TELEMETRY", "true")

from crewai import Agent, Task, Crew, Process
from crewai_tools import MCPServerAdapter
from mcp import StdioServerParameters
from crewai.llm import LLM
import json
from dotenv import load_dotenv

# Load .env from project root (parent of backend/)
load_dotenv()
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

def get_llm():
    model = os.getenv("NEBIUS_MODEL", "nebius/meta-llama/Meta-Llama-3.1-8B-Instruct").strip()
    return LLM(model=model, api_key=os.getenv("NEBIUS_API_KEY"))


def get_server_params():
    return StdioServerParameters(
        command="npx",
        args=["@brightdata/mcp"],
        env={
            "API_TOKEN": os.getenv("BRIGHT_DATA_API_TOKEN"),
            "WEB_UNLOCKER_ZONE": os.getenv("WEB_UNLOCKER_ZONE"),
            "BROWSER_ZONE": os.getenv("BROWSER_ZONE"),
        },
    )


def build_scraper_agent(mcp_tools, llm):
    return Agent(
        role="Senior Real Estate Data Extractor",
        goal=(
            "Return a JSON object with snake_case keys containing: address, price, "
            "bedrooms, bathrooms, square_feet, lot_size, year_built, property_type, "
            "listing_agent, days_on_market, mls_number, description, image_urls, "
            "and neighborhood for the target property listing page. Ensure strict schema validation."
        ),
        backstory=(
            "Veteran real estate data engineer with years of experience extracting "
            "property information from Zillow, Realtor.com, and Redfin. Skilled in "
            "Bright Data MCP, proxy rotation, CAPTCHA avoidance, and strict "
            "JSON-schema validation for real estate data."
        ),
        tools=mcp_tools,
        llm=llm,
        max_iter=5,
        verbose=True,
    )


def build_scraping_task(agent, listing_url: str):
    return Task(
        description=(
            f"Extract property data from {listing_url} "
            "and return it as structured JSON with snake_case keys. "
            "REQUIRE an `image_urls` array of direct, high-resolution absolute URLs (preferred hosts: photos.zillowstatic.com, realtor image hosts, or other CDN links). "
            "If available, include at least 3 gallery images in `image_urls`. Always return fully-qualified URLs and do NOT return HTML or data URIs in the list."
        ),
        expected_output="""{
            "address": "123 Main Street, City, State 12345",
            "price": "$450,000",
            "bedrooms": 3,
            "bathrooms": 2,
            "square_feet": 1850,
            "lot_size": "0.25 acres",
            "year_built": 1995,
            "property_type": "Single Family Home",
            "listing_agent": "John Doe, ABC Realty",
            "days_on_market": 45,
            "mls_number": "MLS123456",
            "description": "Beautiful home with updated kitchen...",
            "image_urls": ["https://photos.zillowstatic.com/fp/abcdef-p_e.jpg", "https://example-cdn.com/images/1.jpg", "https://example-cdn.com/images/2.jpg"],
            "neighborhood": "Downtown Historic District"
        }""",
        agent=agent,
    )


def scrape_property_data(listing_url: str):
    """Run the scraping crew for the given listing URL. Returns raw crew result."""
    llm = get_llm()
    server_params = get_server_params()
    with MCPServerAdapter(server_params) as mcp_tools:
        scraper_agent = build_scraper_agent(mcp_tools, llm)
        scraping_task = build_scraping_task(scraper_agent, listing_url)
        crew = Crew(
            agents=[scraper_agent],
            tasks=[scraping_task],
            process=Process.sequential,
            verbose=True,
        )
        return crew.kickoff()


if __name__ == "__main__":
    import sys
    url = sys.argv[1] if len(sys.argv) > 1 else "https://www.zillow.com/homedetails/123-Main-St-City-State-12345/123456_zpid/"
    try:
        result = scrape_property_data(url)
        print("\n[SUCCESS] Scraping completed!")
        print("Extracted property data:")
        print(result)
    except Exception as e:
        print(f"\n[ERROR] Scraping failed: {str(e)}")
        raise
