#!/bin/bash

if [[ `git status --porcelain` ]]; then
  # changes
  >&2 echo "You have unstaged changes. Please commit before you run this."
  exit 1
fi

REPO=git@github.com:Blizzard/node-rdkafka.git

git remote add deploy $REPO

# Get the most recent stuff if we don't have it
git fetch deploy gh-pages || exit $?

make docs || exit $?

# Get package version and save to variable

PACKAGE=$(node -pe 'require("./package.json").name.split("/")[1]')
VERSION=$(node -pe 'require("./package.json").version')

# Make a temporary folder

TEMPDIR=$(mktemp -d)

VERSIONDIR="$TEMPDIR/$VERSION"
cp -r docs $VERSIONDIR

# Now, checkout the gh-pages, but first get current checked out branch
#

CURRENT_BRANCH=$(git rev-parse --symbolic-full-name --abbrev-ref HEAD)

COMMIT_MESSAGE=$(git log --pretty='format:%B' -1)
COMMIT_AUTHOR=$(git log --pretty='format:%aN <%aE>' -1)

if [[ `git checkout --quiet -b gh-pages deploy/gh-pages` ]]; then
  >&2 echo "Could not checkout gh-pages"
  exit 1
fi

rm -rf current
rm -rf $VERSION

cp -r $VERSIONDIR $VERSION
cp -r $VERSIONDIR current

git add --all
git commit --author="$COMMIT_AUTHOR" -m "Updated docs for '$COMMIT_MESSAGE'"

rm -rf $TEMPDIR

git push $REPO gh-pages || exit $?

git checkout $CURRENT_BRANCH
