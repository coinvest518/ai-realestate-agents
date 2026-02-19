-- Update property URLs to use actual Realtor.com/Redfin listings

UPDATE public.bright_data_cache 
SET property_url = 'https://www.realtor.com/realestateandhomes-detail/362-Clinton-Ave_Albany_NY_12206_M39828-17001'
WHERE property_url = 'https://www.zillow.com/homedetails/362-Clinton-Ave-Albany-NY-12206/';

UPDATE public.bright_data_cache 
SET property_url = 'https://www.realtor.com/realestateandhomes-detail/75-S-Pine-Ave_Albany_NY_12208_M45913-97080'
WHERE property_url = 'https://www.zillow.com/homedetails/75-S-Pine-Ave-Albany-NY-12208/';

UPDATE public.bright_data_cache 
SET property_url = 'https://www.realty.com/home-listings/1052233829/12-Arcadia-Court-Colonie-NY-12205'
WHERE property_url = 'https://www.zillow.com/homedetails/12-Arcadia-Ct-Colonie-NY-12205/';
