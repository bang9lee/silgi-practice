@echo off
rem Silgi practice launcher (no install needed)
set ELECTRON_RUN_AS_NODE=
set "APP=%~dp0dist\win-unpacked\SilgiPractice.exe"
if exist "%APP%" (
  start "" "%APP%"
) else (
  echo Program not built yet. Run: npm run build
  pause
)
