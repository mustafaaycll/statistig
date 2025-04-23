#!/bin/bash -e

# ==============================================================================
# This script updates the template (.pot) and the translation files (.po) with
# the latest strings from the source code. It requires gettext to be installed.
# ==============================================================================

cd -- "$( dirname "$0" )/../"

function update_translations() {
	if ! command -v msgfmt &> /dev/null; then
		echo "ERROR: gettext isn't installed. Skipping translation updates..."
		exit 1
	fi

	# update main.pot
	echo -n "Updating 'po/main.pot'"
	find src/ data/ \( -name '*.js' -o -name '*.ui' \) -print0 | xargs -0 xgettext \
		--from-code=UTF-8 \
		--output=po/main.pot \
		--add-comments='Translators:'
	echo "................ done."

	# update .po files
	if find po/ | grep -q ".po$" ; then
		for FILE in po/*.po; do
			echo -n "Updating '$FILE'..."
			msgmerge -NU "$FILE" po/main.pot
		done
	fi
		echo "There are no .po files to update."
}

function usage() {
	cat <<-EOF
	Update the translation template (.pot) and the translation (.po) files

	Usage:
	  $(basename "$0")
	EOF
}

if [ $# -eq 0 ]; then
	update_translations
	exit 0
elif [ $# -eq 1 ]; then
	case "$1" in
		--help | -h)
			usage
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
