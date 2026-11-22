@REM Maven Wrapper for Windows
@REM Licensed to the Apache Software Foundation (ASF)

@echo off
setlocal

set MAVEN_PROJECTBASEDIR=%~dp0

set WRAPPER_PROPERTIES=%MAVEN_PROJECTBASEDIR%.mvn\wrapper\maven-wrapper.properties

@REM Parse distributionUrl
for /f "tokens=2 delims==" %%a in ('findstr "distributionUrl" "%WRAPPER_PROPERTIES%"') do set DISTRIBUTION_URL=%%a

@REM User home for wrapper cache
if "%MAVEN_USER_HOME%"=="" set MAVEN_USER_HOME=%USERPROFILE%\.m2
set WRAPPER_JAR_DIR=%MAVEN_USER_HOME%\wrapper
if not exist "%WRAPPER_JAR_DIR%" mkdir "%WRAPPER_JAR_DIR%"

@REM Use JAVA_HOME if set
if not "%JAVA_HOME%"=="" (
    set JAVA_CMD="%JAVA_HOME%\bin\java.exe"
) else (
    set JAVA_CMD=java
)

@REM Download wrapper jar if missing
set WRAPPER_JAR=%WRAPPER_JAR_DIR%\maven-wrapper.jar
if not exist "%WRAPPER_JAR%" (
    for /f "tokens=2 delims==" %%a in ('findstr "wrapperUrl" "%WRAPPER_PROPERTIES%"') do set WRAPPER_URL=%%a
    powershell -Command "Invoke-WebRequest -Uri '%WRAPPER_URL%' -OutFile '%WRAPPER_JAR%'" 2>nul
    if not exist "%WRAPPER_JAR%" (
        echo Failed to download maven-wrapper.jar from %WRAPPER_URL%
        exit /b 1
    )
)

%JAVA_CMD% -classpath "%WRAPPER_JAR%" org.apache.maven.wrapper.MavenWrapperMain "-MavenWrapperProperties=%WRAPPER_PROPERTIES%" %*
