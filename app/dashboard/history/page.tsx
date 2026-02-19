"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Download, Search, Trash2, User, Building2, Calendar } from "lucide-react"
import { toast } from "sonner"

type HistoryItem = {
  id: string
  type: "people" | "property"
  query: string
  results: any
  source: string
  status: string
  created_at: string
}

export default function HistoryPage() {
  const [searchHistory, setSearchHistory] = useState<HistoryItem[]>([])
  const [propertyHistory, setPropertyHistory] = useState<HistoryItem[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    try {
      const [peopleRes, propertyRes] = await Promise.all([
        fetch('http://localhost:8000/api/history/people', {
          headers: { 'X-User-ID': 'user-123' }
        }),
        fetch('http://localhost:8000/api/history/property', {
          headers: { 'X-User-ID': 'user-123' }
        })
      ])
      
      if (peopleRes.ok) {
        const data = await peopleRes.json()
        setSearchHistory(data.data || [])
      }
      
      if (propertyRes.ok) {
        const data = await propertyRes.json()
        setPropertyHistory(data.data || [])
      }
    } catch (error) {
      toast.error("Failed to load history")
    } finally {
      setLoading(false)
    }
  }

  const exportToPDF = async (item: HistoryItem) => {
    try {
      const response = await fetch(`http://localhost:8000/api/history/export/${item.type}/${item.id}`, {
        headers: { 'X-User-ID': 'user-123' }
      })
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${item.type}_${item.id}.pdf`
        a.click()
        toast.success("PDF downloaded")
      } else {
        toast.error("Failed to generate PDF")
      }
    } catch (error) {
      toast.error("Failed to export PDF")
    }
  }

  const deleteItem = async (id: string, type: string) => {
    try {
      const response = await fetch(`http://localhost:8000/api/history/${type}/${id}`, {
        method: 'DELETE',
        headers: { 'X-User-ID': 'user-123' }
      })
      
      if (response.ok) {
        toast.success("Item deleted")
        fetchHistory()
      } else {
        toast.error("Failed to delete item")
      }
    } catch (error) {
      toast.error("Failed to delete item")
    }
  }

  const filteredPeopleHistory = searchHistory.filter(item =>
    item.query.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredPropertyHistory = propertyHistory.filter(item =>
    item.query.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">Search History</h1>
        <p className="text-sm text-muted-foreground">
          View, export, and manage your search history
        </p>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search history..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Tabs defaultValue="people" className="w-full">
        <TabsList>
          <TabsTrigger value="people" className="gap-2">
            <User className="size-4" />
            People Searches
            <Badge variant="secondary">{filteredPeopleHistory.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="property" className="gap-2">
            <Building2 className="size-4" />
            Property Scrapes
            <Badge variant="secondary">{filteredPropertyHistory.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="people" className="mt-6">
          <ScrollArea className="h-[600px] pr-4">
            <div className="flex flex-col gap-4">
              {filteredPeopleHistory.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <User className="size-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No people searches yet</p>
                  </CardContent>
                </Card>
              ) : (
                filteredPeopleHistory.map((item) => (
                  <Card key={item.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{item.query}</CardTitle>
                          <CardDescription className="flex items-center gap-2 mt-1">
                            <Calendar className="size-3" />
                            {new Date(item.created_at).toLocaleString()}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={item.status === "completed" ? "default" : "secondary"}>
                            {item.status}
                          </Badge>
                          <Badge variant="outline">{item.source}</Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                          {item.results?.count || 0} results found
                        </p>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => exportToPDF(item)}
                          >
                            <Download className="size-4 mr-2" />
                            Export PDF
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteItem(item.id, "people")}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="property" className="mt-6">
          <ScrollArea className="h-[600px] pr-4">
            <div className="flex flex-col gap-4">
              {filteredPropertyHistory.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Building2 className="size-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No property scrapes yet</p>
                  </CardContent>
                </Card>
              ) : (
                filteredPropertyHistory.map((item) => (
                  <Card key={item.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{item.query}</CardTitle>
                          <CardDescription className="flex items-center gap-2 mt-1">
                            <Calendar className="size-3" />
                            {new Date(item.created_at).toLocaleString()}
                          </CardDescription>
                        </div>
                        <Badge variant={item.status === "completed" ? "default" : "secondary"}>
                          {item.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">Property data scraped</p>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => exportToPDF(item)}
                          >
                            <Download className="size-4 mr-2" />
                            Export PDF
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteItem(item.id, "property")}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  )
}
