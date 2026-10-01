#!/bin/bash

# ==============================================================================
# This script updates the template (.pot) and the translation files (.po) with
# the latest strings from the source code. It requires gettext to be installed.
# ==============================================================================

set -euo pipefail

cd -- "$( dirname "$0" )/../"

POT=po/statistig.pot

function update_translations() {
	for TOOL in xgettext msgmerge msgattrib; do
		if ! command -v "$TOOL" &> /dev/null; then
			echo "ERROR: gettext isn't installed ('$TOOL' not found). Skipping translation updates..."
			exit 1
		fi
	done

	# update the template from the TypeScript sources (xgettext has no TypeScript
	# mode; its JavaScript parser handles the gettext calls in these files)
	echo -n "Updating '$POT'"
	find src -name '*.ts' -print0 | sort -z | xargs -0 xgettext \
		--language=JavaScript \
		--from-code=UTF-8 \
		--keyword=_ \
		--add-comments='Translators:' \
		--no-location \
		--package-name=Statistig \
		--copyright-holder='Mustafa Yücel' \
		--msgid-bugs-address='https://github.com/mustafaaycll/statistig/issues' \
		--output="$POT"
	sed -i.bak \
		-e 's/^# SOME DESCRIPTIVE TITLE\.$/# Translation template for Statistig./' \
		-e 's/^# Copyright (C) YEAR /# Copyright (C) 2025 /' \
		-e 's/^# FIRST AUTHOR <EMAIL@ADDRESS>, YEAR\.$/# Mustafa Yücel <mustafayucel.cs@gmail.com>, 2025./' \
		-e 's/charset=CHARSET/charset=UTF-8/' \
		"$POT" && rm "$POT.bak"
	echo "................ done."

	# update .po files
	if compgen -G "po/*.po" > /dev/null; then
		for FILE in po/*.po; do
			echo -n "Updating '$FILE'"
			msgmerge --quiet --update --no-fuzzy-matching --backup=none "$FILE" "$POT"
			msgattrib --no-obsolete --output-file="$FILE" "$FILE"
			echo "................ done."
		done
	else
		echo "There are no .po files to update."
	fi
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
