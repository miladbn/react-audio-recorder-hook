@echo off
echo Building react-audio-recorder-hook with iOS compatibility fix...

rem Clean previous build
echo Cleaning previous build...
rimraf dist

rem Build package
echo Building package...
npm run build

echo.
echo Build completed successfully!
echo.
echo The package has been updated with the following changes:
echo - Fixed iOS compatibility issues with audio MIME types
echo - Added automatic detection of iOS devices
echo - Updated blob creation to use iOS-friendly formats
echo.
echo To test the changes, you can:
echo 1. Use the package in your project
echo 2. Test on an iOS device to verify compatibility
echo.
echo To use the local version in another project, run:
echo   npm pack
echo.
echo Then in your project:
echo   npm install /path/to/react-audio-recorder-hook-1.0.5.tgz
echo.
pause 