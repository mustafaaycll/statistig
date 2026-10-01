// Copyright (C) 2025 Mustafa Yücel <mustafayucel.cs@gmail.com>

// This file is part of Statistig.

// Statistig is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// Statistig is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with Statistig. If not, see <https://www.gnu.org/licenses/>.

import Adw from 'gi://Adw';
import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';

import {
    ExtensionPreferences,
    gettext as _,
} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

import {StatistigConstants} from './constants.js';
import {StatistigIcons} from './icons.js';

export default class StatistigPrefs extends ExtensionPreferences {
    override async fillPreferencesWindow(window: Adw.PreferencesWindow) {
        const settings = this.getSettings();
        window.add(this.buildSettingsPage(settings, window));
        window.add(this.buildAboutPage());
        window.set_default_size(600, 400);
    }

    private buildSettingsPage(
        settings: Gio.Settings,
        window: Adw.PreferencesWindow,
    ): Adw.PreferencesPage {
        const settingsPage = new Adw.PreferencesPage({
            title: _('Settings'),
            iconName: 'preferences-system-symbolic',
        });

        const appearanceGroup = new Adw.PreferencesGroup({
            title: _('Appearance'),
        });
        appearanceGroup.add(
            this.buildComboRow(
                settings,
                window,
                'icon-theme',
                StatistigConstants.IconPacks,
                {title: _('Icon Pack')},
            ),
        );

        const behaviorGroup = new Adw.PreferencesGroup({
            title: _('Behavior'),
        });
        this.addSwitchRows(settings, behaviorGroup, [
            {
                key: 'proc-mon-enabled',
                title: _('Show processor indicator in status area'),
            },
            {
                key: 'mem-mon-enabled',
                title: _('Show memory indicator in status area'),
            },
        ]);

        const labelGroup = new Adw.PreferencesGroup({
            title: _('Labels'),
        });
        this.addSwitchRows(settings, labelGroup, [
            {
                key: 'proc-lbl-enabled',
                title: _('Show numeric label next to processor indicator'),
            },
            {
                key: 'mem-lbl-enabled',
                title: _('Show numeric label next to memory indicator'),
            },
            {key: 'lbl-monospace', title: _('Use monospace font for labels')},
            {
                key: 'lbl-fixed-width',
                title: _('Use fixed-width formatting for labels'),
            },
        ]);
        labelGroup.add(
            this.buildComboRow(
                settings,
                window,
                'lbl-alignment',
                ['left', 'right'],
                {
                    title: _('Label text alignment'),
                    subtitle: _(
                        'Only applies when fixed-width formatting is enabled',
                    ),
                },
            ),
        );

        settingsPage.add(appearanceGroup);
        settingsPage.add(behaviorGroup);
        settingsPage.add(labelGroup);

        return settingsPage;
    }

    private addSwitchRows(
        settings: Gio.Settings,
        group: Adw.PreferencesGroup,
        rows: {key: string; title: string}[],
    ): void {
        for (const {key, title} of rows) {
            const row = new Adw.SwitchRow({title});
            settings.bind(key, row, 'active', Gio.SettingsBindFlags.DEFAULT);
            group.add(row);
        }
    }

    /**
     * A combo row kept in sync with a string key in both directions. Unknown
     * stored values fall back to the key's default.
     */
    private buildComboRow(
        settings: Gio.Settings,
        window: Adw.PreferencesWindow,
        key: string,
        options: readonly string[],
        props: {title: string; subtitle?: string},
    ): Adw.ComboRow {
        const model = new Gtk.StringList();
        for (const option of options) {
            model.append(option.charAt(0).toUpperCase() + option.slice(1));
        }
        const row = new Adw.ComboRow({...props, model});

        const indexOf = (value: string): number => {
            const index = options.indexOf(value);
            if (index >= 0) {
                return index;
            }
            const fallback = options.indexOf(
                settings.get_default_value(key)?.get_string()[0] ?? '',
            );
            return fallback >= 0 ? fallback : 0;
        };
        const syncFromSettings = () => {
            row.selected = indexOf(settings.get_string(key));
        };

        syncFromSettings();
        row.connect('notify::selected', () => {
            if (row.selected === Gtk.INVALID_LIST_POSITION) {
                return;
            }
            const value = options[row.selected];
            if (settings.get_string(key) !== value) {
                settings.set_string(key, value);
            }
        });

        const handlerId = settings.connect(`changed::${key}`, syncFromSettings);
        window.connect('close-request', () => {
            settings.disconnect(handlerId);
            return false;
        });

        return row;
    }

    private buildAboutPage(): Adw.PreferencesPage {
        const aboutPage = new Adw.PreferencesPage({
            title: _('About'),
            iconName: 'org.gnome.Settings-about-symbolic',
        });

        const infoBox = new Gtk.Box({
            orientation: Gtk.Orientation.VERTICAL,
            spacing: 12,
            margin_top: 32,
            margin_bottom: 32,
            margin_start: 32,
            margin_end: 32,
            halign: Gtk.Align.CENTER,
        });

        const extensionIcon = new Gtk.Image({
            gicon: StatistigIcons.getStatistigSymbolicIcon(this.path),
            pixel_size: 64,
        });

        const extensionName = new Gtk.Label({
            label: 'Statistig',
            css_classes: ['title-1'],
            justify: Gtk.Justification.CENTER,
        });

        const extensionDescription = new Gtk.Label({
            label: _('Native-like Resource Monitoring'),
            css_classes: ['title-2'],
            justify: Gtk.Justification.CENTER,
        });

        const extensionAuthor = new Gtk.Label({
            label: _('authored by Mustafa Yücel'),
            justify: Gtk.Justification.CENTER,
        });

        const externalLink = Gtk.LinkButton.new_with_label(
            'https://github.com/mustafaaycll/statistig',
            _('View on GitHub'),
        );

        infoBox.append(extensionIcon);
        infoBox.append(extensionName);
        infoBox.append(extensionDescription);
        infoBox.append(extensionAuthor);
        infoBox.append(externalLink);

        const infoRow = new Adw.ActionRow({
            activatable: false,
            selectable: false,
        });
        infoRow.set_child(infoBox);

        const infoGroup = new Adw.PreferencesGroup();
        infoGroup.add(infoRow);

        aboutPage.add(infoGroup);
        return aboutPage;
    }
}
