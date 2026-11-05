# State for the staging environment. The bucket is created once by hand (see README).
bucket       = "REPLACE-WITH-STATE-BUCKET"
key          = "tvet-portal/staging/terraform.tfstate"
region       = "af-south-1"
encrypt      = true
use_lockfile = true
