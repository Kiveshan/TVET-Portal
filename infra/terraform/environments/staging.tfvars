environment = "staging"

ingestion_bucket = "dhet-ingestion-landing-515966540182"
approved_bucket  = "dhet-approved"

# Terraform issues the certificate and creates the DNS record in the tvet-portal.co.za zone.
domain_name = "staging.tvet-portal.co.za"

# Staging can be torn down; prod keeps the default (true).
deletion_protection = false
