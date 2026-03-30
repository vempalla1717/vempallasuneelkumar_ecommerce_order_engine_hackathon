@echo off
echo ============================================
echo   Starting E-Commerce Backend Server
echo ============================================
echo.

set JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-17.0.18.8-hotspot
set PATH=%JAVA_HOME%\bin;%PATH%

echo Make sure MySQL is running on localhost:3306!
echo Database: ecommerce_order_engine
echo.

cd /d "%~dp0backend"
"%~dp0apache-maven-3.9.6\bin\mvn.cmd" spring-boot:run
pause
