#!/usr/bin/env bash

# ==============================================================================
# This script builds the zip package for the extension. It compiles translations
# and installs the extension, if requested. Use `--help` for more information.
# ==============================================================================

set -euo pipefail

function compile_translations() {
	echo "Compiling translations..."

	while read -r LOCALE; do
		# Skip empty lines and comments
		[[ -z "$LOCALE" || "$LOCALE" == \#* ]] && continue

		local PO_FILE="po/$LOCALE.po"
		if [ ! -f "$PO_FILE" ]; then
			echo "ERROR: '$LOCALE' is listed in po/LINGUAS but $PO_FILE doesn't exist. Exiting..."
			exit 1
		fi

		mkdir -p "$JS_DIR/locale/$LOCALE/LC_MESSAGES"
		msgfmt -c "$PO_FILE" -o "$JS_DIR/locale/$LOCALE/LC_MESSAGES/$UUID.mo"
	done < po/LINGUAS

	echo "Translations compiled."
}

function build_extension_package() {
	if ! command -v npm &> /dev/null; then
		echo "ERROR: npm isn't installed. Can't compile TypeScript files. Exiting..."
		exit 1
	fi

	if [ ! -d node_modules ]; then
		echo "Installing dependencies from NPM to compile TypeScript..."
		npm install > /dev/null
		echo "Dependencies installed."
	fi

	echo "Removing old $JS_DIR/..."
	rm -rf "$JS_DIR"

	echo "Type checking..."
	npm run --silent check:types

	echo "Compiling TypeScript files..."
	node ./scripts/esbuild.js
	echo "Done."

	echo "Copying non-TypeScript src files to the $JS_DIR directory..."
	find src -type f ! -name '*.ts' ! -name '.DS_Store' | while IFS= read -r FILE; do
		local DEST="$JS_DIR/${FILE#src/}"
		mkdir -p "$(dirname "$DEST")"
		cp "$FILE" "$DEST"
	done
	echo "Done."

	if command -v msgfmt &> /dev/null; then
		compile_translations
	else
		echo "WARNING: gettext isn't installed. Skipping compilation of translations..."
	fi

	echo "Creating clean extension zip..."

	# Build into temporary folder with flat structure
	rm -rf _build_temp "$UUID.shell-extension.zip"
	mkdir -p _build_temp

	cp -r "$JS_DIR"/. _build_temp/
	cp metadata.json LICENSE _build_temp/

	(
		cd _build_temp
		zip -qr "../$UUID.shell-extension.zip" .
	)
	rm -rf _build_temp

	echo "Extension package zipped at: $UUID.shell-extension.zip"
}

function print_reload_instructions() {
	cat <<-EOF

	GNOME Shell can't be restarted from a script on GNOME 49 and later (X11
	sessions are gone), so load the new build in one of these ways:
	  * Wayland, GNOME 49+:  dbus-run-session gnome-shell --devkit --wayland
	  * Wayland, GNOME 48:   dbus-run-session gnome-shell --nested --wayland
	    (runs a nested shell in a window; enable the extension inside it)
	  * X11, GNOME 48 only:  press Alt+F2, type 'r' and press Enter
	  * Otherwise:           log out and log back in
	See https://gjs.guide/extensions/development/debugging.html
	EOF
}

function install_extension_package() {
	echo "Installing the extension..."
	gnome-extensions install --force "$UUID".shell-extension.zip
	echo "Extension installed."

	if [ "${1:-}" = "-r" ]; then
		print_reload_instructions
	else
		echo "Log out and log back in to apply the changes."
		echo "After that, if you haven't enabled the extension yet, do so to start using it."
	fi
}

function usage() {
	cat <<-EOF
	Build the zip package for this extension

	Usage:
	  $(basename "$0") [OPTION]

	Options:
	  -i, --install         Install the extension after building
	  -r, --unsafe-reload   Build and install the extension, then explain how to
	                        load the new build without logging out (nested
	                        GNOME Shell on Wayland, or Alt+F2 'r' on GNOME 48 X11)
	  -h, --help            Display this help message
	EOF
}

###########################
# Main script starts here #
###########################

cd -- "$( dirname "$0" )/../"

UUID=$(node -p "require('./metadata.json').uuid")
JS_DIR="dist"

if [ $# -eq 0 ]; then
	build_extension_package
	exit 0
elif [ $# -eq 1 ]; then
	case "$1" in
		--install | -i)
			build_extension_package
			install_extension_package
			exit 0
			;;
		--help | -h)
			usage
			exit 0
			;;
		--unsafe-reload | -r)
			build_extension_package
			install_extension_package -r
			exit 0
			;;
		*)
			echo "Invalid option: $1. Use --help for help."
			exit 1
			;;
	esac
else
	echo "Invalid number of arguments. Use --help for help."
	exit 1
fi
