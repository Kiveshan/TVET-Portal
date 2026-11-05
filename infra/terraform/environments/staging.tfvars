environment = "staging"

ingestion_bucket = "dhet-ingestion-landing-515966540182"
approved_bucket  = "dhet-approved"

# Request a certificate in ACM (af-south-1) for the portal's domain and paste its ARN here.
# Until then the portal serves plain HTTP and sign-in won't work.
certificate_arn = ""

# Staging can be torn down; prod keeps the default (true).
deletion_protection = false
