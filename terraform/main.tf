# ==============================================================================
# AWS Provider Configuration
# ==============================================================================
provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "Terraform"
      Course      = "CNAD-CA2"
    }
  }
}

# ==============================================================================
# Networking Infrastructure: Custom VPC, Subnet, Internet Gateway & Routing
# ==============================================================================

# Custom Virtual Private Cloud (VPC)
resource "aws_vpc" "devops_vpc" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "${var.project_name}-vpc-${var.environment}"
  }
}

# Internet Gateway for public internet ingress/egress
resource "aws_internet_gateway" "devops_igw" {
  vpc_id = aws_vpc.devops_vpc.id

  tags = {
    Name = "${var.project_name}-igw-${var.environment}"
  }
}

# Public Subnet
resource "aws_subnet" "devops_subnet" {
  vpc_id                  = aws_vpc.devops_vpc.id
  cidr_block              = var.subnet_cidr
  availability_zone       = var.availability_zone
  map_public_ip_on_launch = true

  tags = {
    Name = "${var.project_name}-public-subnet"
  }
}

# Route Table directing traffic to the Internet Gateway
resource "aws_route_table" "public_rt" {
  vpc_id = aws_vpc.devops_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.devops_igw.id
  }

  tags = {
    Name = "${var.project_name}-public-rt"
  }
}

# Associate Public Subnet with Public Route Table
resource "aws_route_table_association" "public_assoc" {
  subnet_id      = aws_subnet.devops_subnet.id
  route_table_id = aws_route_table.public_rt.id
}

# ==============================================================================
# Security Group & Traffic Filtering Rules
# ==============================================================================
resource "aws_security_group" "app_sg" {
  name        = "${var.project_name}-app-sg"
  description = "Controls ingress and egress traffic for CloudOps Web Application"
  vpc_id      = aws_vpc.devops_vpc.id

  # Ingress Rule: SSH Remote Administration
  ingress {
    description = "SSH administrative remote terminal access"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.allowed_ssh_cidr]
  }

  # Ingress Rule: HTTP Web Traffic
  ingress {
    description = "Standard HTTP web traffic"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Ingress Rule: HTTPS Secure Web Traffic
  ingress {
    description = "Secure HTTPS encrypted web traffic"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Ingress Rule: Node.js CloudOps Application Port
  ingress {
    description = "Node.js CloudOps application server port"
    from_port   = var.app_port
    to_port     = var.app_port
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Egress Rule: Full Outbound Internet Access (package installation, updates, API calls)
  egress {
    description = "Permit all outbound network connectivity"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-app-security-group"
  }
}

# ==============================================================================
# Compute Infrastructure: AWS EC2 Instance with Cloud-Init / User Data
# ==============================================================================
resource "aws_instance" "app_server" {
  ami                         = var.ami_id
  instance_type               = var.instance_type
  subnet_id                   = aws_subnet.devops_subnet.id
  vpc_security_group_ids      = [aws_security_group.app_sg.id]
  associate_public_ip_address = true
  key_name                    = var.key_name != "" ? var.key_name : null

  # Root block volume storage configuration
  root_block_device {
    volume_size           = 20
    volume_type           = "gp3"
    iops                  = 3000
    throughput            = 125
    encrypted             = true
    delete_on_termination = true

    tags = {
      Name = "${var.project_name}-root-volume"
    }
  }

  # Automate runtime deployment using user-data cloud-init script
  user_data = file("${path.module}/user-data.sh")

  tags = {
    Name = "${var.project_name}-ec2-app-server"
    Role = "ApplicationServer"
  }
}
