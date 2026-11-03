terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # In production, state is maintained remotely in AWS S3 with DynamoDB state locking
  # backend "s3" {
  #   bucket         = "devops-cnad-terraform-state-bucket"
  #   key            = "ca2/production/terraform.tfstate"
  #   region         = "us-east-1"
  #   dynamodb_table = "devops-terraform-locks"
  #   encrypt        = true
  # }
}

