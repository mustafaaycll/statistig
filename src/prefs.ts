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
import Gtk from 'gi://Gtk';

import {
    ExtensionPreferences,
    gettext as _,
} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

import { StatistigConstants } from './constants.js';
import { StatistigConfig } from './config.js';
import { StatistigIcons } from './icons.js';

export default class StatistigPrefs extends ExtensionPreferences {
    fillPreferencesWindow(window: Adw.PreferencesWindow) {
        return new Promise<void>((resolve) => {
            const config = new StatistigConfig(this.getSettings(), null);
            window.add(this.buildSettingsPage(config));
            window.add(this.buildAboutPage(config));
            window.set_default_size(600, 400);
            resolve();
        });
    }

    private buildSettingsPage(config: StatistigConfig): Adw.PreferencesPage {

        const settingsPage = new Adw.PreferencesPage({
            title: _('Settings'),
            iconName: 'preferences-system-symbolic',
        });
    
        const appearanceGroup = new Adw.PreferencesGroup({
            title: _('Appearance'),
        });
    
        const availableIconPacks = StatistigConstants.IconPacks;
        const selectedIconPack = config.iconTheme;
        const iconPackList = new Gtk.StringList();
        for (const icon of availableIconPacks) {
            iconPackList.append(icon.charAt(0).toUpperCase() + icon.slice(1));
        }

        const iconPackRow = new Adw.ComboRow({
            title: _('Icon Pack'),
            model: iconPackList,
        });
        iconPackRow.selected = availableIconPacks.indexOf(selectedIconPack) ?? 0;
        iconPackRow.connect('notify::selected-item', () => {
            config.iconTheme = availableIconPacks[iconPackRow.selected];
        });
    
        appearanceGroup.add(iconPackRow);

        const behaviorGroup = new Adw.PreferencesGroup({
            title: _('Behavior'),
        });

        const booleanSettings: { key: keyof StatistigConfig, title: string }[] = [
            { key: 'procMonitoringEnabled', title: _('Show processor indicator in status area') },
            { key: 'procButtonEnabled',     title: _('Show processor button in quick settings') },
            { key: 'memMonitoringEnabled',  title: _('Show memory indicator in status area') },
            { key: 'memButtonEnabled',      title: _('Show memory button in quick settings') },
            { key: 'batteryButtonStyled',   title: _('Enforce styling on battery button in quick settings') },
            { key: 'screenshotButtonHidden',title: _('Hide screenshot button in quick settings') },
            { key: 'settingsButtonHidden',  title: _('Hide settings button in quick settings') },
            { key: 'lockButtonHidden',      title: _('Hide lock button in quick settings') },
        ];

        for (const { key, title } of booleanSettings) {
            const row = new Adw.ActionRow({
                title: title,
            });

            const toggle = new Gtk.Switch({
                active: config[key] as boolean,
                valign: Gtk.Align.CENTER,
            });

            toggle.connect('notify::active', () => {
                // @ts-ignore: accessing a read-only setter by key is normally forbidden in TS
                config[key] = toggle.active;
            });

            row.add_suffix(toggle);
            row.activatable_widget = toggle;
            behaviorGroup.add(row);
        }

        settingsPage.add(appearanceGroup);
        settingsPage.add(behaviorGroup);

        return settingsPage;
    }
    

    private buildAboutPage(config: StatistigConfig): Adw.PreferencesPage {
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
            gicon: StatistigIcons.getStatistigSymbolicIcon(config.basePath),
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
            justify: Gtk.Justification.CENTER
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
