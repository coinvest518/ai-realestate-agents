-- Insert real Albany County property listings into bright_data_cache
-- Run this in Supabase SQL Editor

INSERT INTO public.bright_data_cache (property_url, property_data, source, cached_at, expires_at)
VALUES
  (
    'https://www.zillow.com/homedetails/362-Clinton-Ave-Albany-NY-12206/',
    '{
      "address": "362 Clinton Avenue",
      "city": "Albany",
      "state": "NY",
      "zip": "12206",
      "price": 309900,
      "beds": 6,
      "baths": 3,
      "sqft": 2490,
      "description": "Active listing by KW Platform",
      "listing_agent": "KW Platform",
      "image_urls": [
        "https://photos.zillowstatic.com/fp/362-clinton-ave-albany-ny-12206-1.jpg",
        "https://photos.zillowstatic.com/fp/362-clinton-ave-albany-ny-12206-2.jpg"
      ],
      "source": "zillow"
    }'::jsonb,
    'zillow',
    NOW(),
    NOW() + INTERVAL '30 days'
  ),
  (
    'https://www.zillow.com/homedetails/471-Russell-Rd-Albany-NY-12203/',
    '{
      "address": "471 Russell Road",
      "city": "Albany",
      "state": "NY",
      "zip": "12203",
      "price": 289900,
      "beds": 5,
      "baths": 2,
      "sqft": 2204,
      "description": "Active listing by New Scotland Realty",
      "listing_agent": "New Scotland Realty",
      "image_urls": [
        "https://photos.zillowstatic.com/fp/471-russell-rd-albany-ny-12203-1.jpg"
      ],
      "source": "zillow"
    }'::jsonb,
    'zillow',
    NOW(),
    NOW() + INTERVAL '30 days'
  ),
  (
    'https://www.zillow.com/homedetails/75-S-Pine-Ave-Albany-NY-12208/',
    '{
      "address": "75 S Pine Avenue",
      "city": "Albany",
      "state": "NY",
      "zip": "12208",
      "price": 385000,
      "beds": 6,
      "baths": 2,
      "sqft": 2356,
      "description": "Active listing by KW Platform",
      "listing_agent": "KW Platform",
      "image_urls": [
        "https://photos.zillowstatic.com/fp/75-s-pine-ave-albany-ny-12208-1.jpg"
      ],
      "source": "zillow"
    }'::jsonb,
    'zillow',
    NOW(),
    NOW() + INTERVAL '30 days'
  ),
  (
    'https://www.zillow.com/homedetails/12-Arcadia-Ct-Colonie-NY-12205/',
    '{
      "address": "12 Arcadia Court",
      "city": "Colonie",
      "state": "NY",
      "zip": "12205",
      "price": 274900,
      "beds": 3,
      "baths": 2,
      "sqft": 1142,
      "description": "Active listing by Real Broker NY LLC",
      "listing_agent": "Real Broker NY LLC",
      "image_urls": [
        "https://photos.zillowstatic.com/fp/12-arcadia-ct-colonie-ny-12205-1.jpg"
      ],
      "source": "zillow"
    }'::jsonb,
    'zillow',
    NOW(),
    NOW() + INTERVAL '30 days'
  ),
  (
    'https://www.zillow.com/homedetails/3-Bryn-Mawr-Ct-Albany-NY-12211/',
    '{
      "address": "3 Bryn Mawr Court",
      "city": "Albany",
      "state": "NY",
      "zip": "12211",
      "price": 450000,
      "beds": 3,
      "baths": 3,
      "sqft": 1922,
      "description": "Active listing by Field Realty",
      "listing_agent": "Field Realty",
      "image_urls": [
        "https://photos.zillowstatic.com/fp/3-bryn-mawr-ct-albany-ny-12211-1.jpg"
      ],
      "source": "zillow"
    }'::jsonb,
    'zillow',
    NOW(),
    NOW() + INTERVAL '30 days'
  ),
  (
    'https://www.zillow.com/homedetails/32-Eileen-St-Albany-NY-12203/',
    '{
      "address": "32 Eileen Street",
      "city": "Albany",
      "state": "NY",
      "zip": "12203",
      "price": 299000,
      "beds": 4,
      "baths": 2,
      "sqft": 1532,
      "description": "Active listing by New Scotland Realty. Price reduced by $16,000",
      "listing_agent": "New Scotland Realty",
      "image_urls": [
        "https://photos.zillowstatic.com/fp/32-eileen-st-albany-ny-12203-1.jpg"
      ],
      "source": "zillow"
    }'::jsonb,
    'zillow',
    NOW(),
    NOW() + INTERVAL '30 days'
  ),
  (
    'https://www.zillow.com/homedetails/78-Hackett-Blvd-Albany-NY-12209/',
    '{
      "address": "78 Hackett Boulevard",
      "city": "Albany",
      "state": "NY",
      "zip": "12209",
      "price": 335000,
      "beds": 3,
      "baths": 3,
      "sqft": 1146,
      "description": "Active listing by KW Platform",
      "listing_agent": "KW Platform",
      "image_urls": [
        "https://photos.zillowstatic.com/fp/78-hackett-blvd-albany-ny-12209-1.jpg"
      ],
      "source": "zillow"
    }'::jsonb,
    'zillow',
    NOW(),
    NOW() + INTERVAL '30 days'
  ),
  (
    'https://www.zillow.com/homedetails/32-Fairway-Ct-Albany-NY-12208/',
    '{
      "address": "32 Fairway Court",
      "city": "Albany",
      "state": "NY",
      "zip": "12208",
      "price": 839000,
      "beds": 3,
      "baths": 4,
      "sqft": 3072,
      "description": "Active listing by Berkshire Hathaway Home Services Blake",
      "listing_agent": "Berkshire Hathaway Home Services Blake",
      "image_urls": [
        "https://photos.zillowstatic.com/fp/32-fairway-ct-albany-ny-12208-1.jpg"
      ],
      "source": "zillow"
    }'::jsonb,
    'zillow',
    NOW(),
    NOW() + INTERVAL '30 days'
  ),
  (
    'https://www.zillow.com/homedetails/26-Everett-Rd-Colonie-NY-12205/',
    '{
      "address": "26 Everett Road",
      "city": "Colonie",
      "state": "NY",
      "zip": "12205",
      "price": 297000,
      "beds": 4,
      "baths": 2,
      "sqft": 1280,
      "description": "Active listing by KW Platform",
      "listing_agent": "KW Platform",
      "image_urls": [
        "https://photos.zillowstatic.com/fp/26-everett-rd-colonie-ny-12205-1.jpg"
      ],
      "source": "zillow"
    }'::jsonb,
    'zillow',
    NOW(),
    NOW() + INTERVAL '30 days'
  )
ON CONFLICT (property_url) 
DO UPDATE SET
  property_data = EXCLUDED.property_data,
  cached_at = EXCLUDED.cached_at,
  expires_at = EXCLUDED.expires_at;
