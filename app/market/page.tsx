"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel"
import { MapPin, DollarSign, Home, Maximize2, Loader2, ExternalLink } from "lucide-react"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000"

type Property = {
  id: string
  url: string
  address: string
  city: string
  state: string
  zip: string
  price: number | null
  beds: number | null
  baths: number | null
  sqft: number | null
  image_urls: string[]
  description: string
  source: string
  cached_at: string
}

function extractZpidFromUrl(url: string): string | null {
  const match = url.match(/\/(\d+)_zpid/)
  return match ? match[1] : null
}

function generatePlaceholderImages(index: number): string[] {
  // Use Unsplash for free high-quality house images
  const houseIds = [
    'photo-1568605114967-8130f3a36994', // Modern house
    'photo-1570129477492-45c003edd2be', // White house
    'photo-1600596542815-ffad4c1539a9', // Suburban house
    'photo-1600585154340-be6161a56a0c', // Contemporary house
  ]
  const id = houseIds[index % houseIds.length]
  return [
    `https://images.unsplash.com/${id}?w=800&h=600&fit=crop`,
    `https://images.unsplash.com/${id}?w=800&h=600&fit=crop&sat=-100`,
    `https://images.unsplash.com/${id}?w=800&h=600&fit=crop&brightness=10`,
  ]
}

export default function MarketPage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [limit, setLimit] = useState(20)

  useEffect(() => {
    fetchProperties()
  }, [limit])

  const fetchProperties = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/api/market/properties?limit=${limit}`)
      if (!res.ok) throw new Error("Failed to fetch properties")
      const data = await res.json()
      const propsWithImages = (data.properties || []).map((prop: Property, idx: number) => {
        // Replace fake/placeholder image URLs with real Unsplash images
        const hasFakeImages = !prop.image_urls || 
          prop.image_urls.length === 0 || 
          prop.image_urls.some(url => 
            url.includes('abcdef') || 
            url.includes('xyz123') || 
            url.includes('example') ||
            !url.startsWith('http')
          )
        
        if (hasFakeImages) {
          prop.image_urls = generatePlaceholderImages(idx)
        }
        return prop
      })
      setProperties(propsWithImages)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error loading properties")
      setProperties([])
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: number | null) => {
    if (!price) return "N/A"
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(price)
  }

  const formatSqft = (sqft: number | null) => {
    if (!sqft) return "N/A"
    return new Intl.NumberFormat("en-US").format(sqft)
  }

  return (
    <main className="flex-1 overflow-auto bg-background text-foreground">
      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-8 lg:py-10 space-y-8">
        {/* Header */}
        <section className="space-y-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl md:text-4xl font-bold">Market</h1>
            <p className="text-base text-muted-foreground md:text-lg max-w-2xl">
              Browse recently scraped properties from across the market. All data is cached and updated regularly.
            </p>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-4 pt-2">
            <div className="flex items-center gap-2">
              <Home className="size-5 text-primary" />
              <span className="text-sm md:text-base font-medium">{properties.length} properties</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs md:text-sm">Live Data</Badge>
            </div>
          </div>
        </section>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <Loader2 className="size-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading properties...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="pt-6">
              <p className="text-destructive text-sm md:text-base">{error}</p>
              <Button onClick={fetchProperties} className="mt-4" variant="outline">
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!loading && !error && properties.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
              <Home className="size-12 text-muted-foreground/50" />
              <div className="text-center">
                <p className="text-base md:text-lg font-medium text-muted-foreground">No properties yet</p>
                <p className="text-sm text-muted-foreground mt-1">Start scraping properties to see them here</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Properties Grid */}
        {!loading && !error && properties.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
              <Card key={property.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col">
                {/* Image Carousel */}
                {property.image_urls && property.image_urls.length > 0 ? (
                  <div className="relative w-full aspect-[16/9] bg-muted overflow-hidden">
                    {property.image_urls.length === 1 ? (
                      <img
                        src={property.image_urls[0]}
                        alt={property.address}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Carousel className="w-full h-full">
                        <CarouselContent>
                          {property.image_urls.map((url, idx) => (
                            <CarouselItem key={idx} className="w-full h-full">
                              <img
                                src={url}
                                alt={`${property.address}-${idx}`}
                                className="w-full h-full object-cover"
                              />
                            </CarouselItem>
                          ))}
                        </CarouselContent>
                        {property.image_urls.length > 1 && (
                          <>
                            <CarouselPrevious className="left-2" />
                            <CarouselNext className="right-2" />
                          </>
                        )}
                      </Carousel>
                    )}
                    {/* Badge overlay */}
                    <div className="absolute top-3 right-3">
                      <Badge className="text-xs capitalize">{property.source}</Badge>
                    </div>
                  </div>
                ) : (
                  <div className="w-full aspect-[16/9] bg-muted flex items-center justify-center">
                    <Home className="size-12 text-muted-foreground/30" />
                  </div>
                )}

                {/* Content */}
                <CardContent className="flex-1 flex flex-col p-4 gap-4">
                  {/* Address */}
                  <div className="space-y-1">
                    <h3 className="font-semibold text-base md:text-lg line-clamp-2">{property.address}</h3>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="size-4" />
                      <span>
                        {property.city && property.state
                          ? `${property.city}, ${property.state}`
                          : property.zip
                          ? property.zip
                          : "Location N/A"}
                      </span>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="flex items-baseline gap-2">
                    <DollarSign className="size-5 text-primary" />
                    <span className="text-2xl md:text-3xl font-bold">
                      {property.price ? `${(property.price / 1000000).toFixed(1)}M` : "N/A"}
                    </span>
                    {property.price && (
                      <span className="text-xs text-muted-foreground">{formatPrice(property.price)}</span>
                    )}
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-3 gap-3 py-3 border-y border-border/50">
                    <div className="text-center">
                      <div className="text-sm font-semibold">{property.beds ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">Beds</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-semibold">{property.baths ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">Baths</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-semibold flex items-center justify-center gap-1">
                        <Maximize2 className="size-3" />
                        {property.sqft ? `${(property.sqft / 1000).toFixed(1)}k` : "—"}
                      </div>
                      <div className="text-xs text-muted-foreground">Sqft</div>
                    </div>
                  </div>

                  {/* Description */}
                  {property.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{property.description}</p>
                  )}

                  {/* View Button */}
                  <Button
                    asChild
                    className="w-full mt-auto"
                    variant="default"
                  >
                    <a href={property.url} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2">
                      View Listing
                      <ExternalLink className="size-4" />
                    </a>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Load More */}
        {!loading && !error && properties.length > 0 && properties.length >= limit && (
          <div className="flex justify-center pt-4">
            <Button
              onClick={() => setLimit(limit + 20)}
              variant="outline"
              className="px-8"
            >
              Load More Properties
            </Button>
          </div>
        )}
      </div>
    </main>
  )
}
