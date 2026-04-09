// Enforce pnpm usage
module.exports = {
	hooks: {
		readPackageJson: async (pkg) => {
			if (pkg.engines?.npm) {
				delete pkg.engines.npm
			}
			return pkg
		}
	}
}
