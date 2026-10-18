@echo off
rem Assembles the static site into dist\ for GitHub Pages.
setlocal
cd /d "%~dp0.."

if exist dist rmdir /s /q dist
mkdir dist

copy /y index.html dist\ >nul
xcopy /e /i /y css dist\css >nul
xcopy /e /i /y js dist\js >nul

echo Build complete: dist\
endlocal
