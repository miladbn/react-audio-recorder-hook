@echo off
echo Temporarily renaming .releaserc.json to .releaserc.json.bak
ren .releaserc.json .releaserc.json.bak
echo Copying .releaserc.temp.json to .releaserc.json
copy .releaserc.temp.json .releaserc.json
echo Running semantic-release in dry-run mode...
npx semantic-release --dry-run
echo Restoring original .releaserc.json
del .releaserc.json
ren .releaserc.json.bak .releaserc.json
echo Done! 