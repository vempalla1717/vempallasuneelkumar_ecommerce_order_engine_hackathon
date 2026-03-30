#!/bin/bash
echo "============================================"
echo "  Starting E-Commerce Backend Server"
echo "============================================"
echo ""

export JAVA_HOME="/c/Program Files/Eclipse Adoptium/jdk-17.0.18.8-hotspot"
export PATH="$JAVA_HOME/bin:$PATH"
export PATH="$(dirname "$0")/apache-maven-3.9.6/bin:$PATH"

echo "Make sure MySQL is running on localhost:3306!"
echo "Database: ecommerce_order_engine"
echo ""

cd "$(dirname "$0")/backend"
mvn spring-boot:run
