// This script runs semantic-release with a minimal configuration for local testing
const semanticRelease = require('semantic-release');

// Define a minimal configuration
const options = {
  branches: ['main', 'master'],
  dryRun: true,
  ci: false,
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    '@semantic-release/npm',
    [
      '@semantic-release/changelog',
      {
        changelogFile: 'CHANGELOG.md',
      },
    ],
    [
      '@semantic-release/git',
      {
        assets: ['package.json', 'CHANGELOG.md'],
        message: 'chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}',
      },
    ],
  ],
};

// Run semantic-release
(async () => {
  try {
    const result = await semanticRelease(options);

    if (result) {
      const { lastRelease, commits, nextRelease, releases } = result;

      console.log(
        `\n✅ Published ${nextRelease.type} release version ${nextRelease.version} containing ${commits.length} commits.`
      );

      if (lastRelease.version) {
        console.log(`\nThe last release was "${lastRelease.version}".`);
      }

      console.log(`\nThe next release version will be "${nextRelease.version}".`);

      for (const release of releases) {
        console.log(`\nThe release was published to ${release.pluginName}.`);
      }
    } else {
      console.log('\n🚫 No release published.');
    }
  } catch (err) {
    console.error('\n❌ The automated release failed with %O', err);
    process.exit(1);
  }
})();
