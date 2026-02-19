/*
 * Vencord, a modification for Discord's desktop app
 * Copyright (c) 2026 Vendicated and contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { ChatBarButton, ChatBarButtonFactory } from "@api/ChatButtons";
import { addMessageClickListener, MessageClickListener, removeMessageClickListener } from "@api/MessageEvents";
import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";
import { showToast, Toasts } from "@webpack/common";

let legacyListener: MessageClickListener | null = null;
let disposeModernListener: (() => boolean) | null = null;

let legacyClickCount = 0;
let modernClickCount = 0;
let legacyRegistered = false;
let modernRegistered = false;

function showDemoToast(message: string) {
    showToast(`[DisposerDemo] ${message}`, Toasts.Type.MESSAGE);
}

function StatusIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="6" cy="10" r="4" fill={legacyRegistered ? "#a6d189" : "#e78284"} />
            <circle cx="14" cy="10" r="4" fill={modernRegistered ? "#8caaee" : "#e78284"} />
        </svg>
    );
}

const DemoButton: ChatBarButtonFactory = ({ isMainChat }) => {
    if (!isMainChat) return null;

    return (
        <ChatBarButton
            tooltip="Disposer demo status"
            onClick={() => {
                showDemoToast(
                    `legacy(${legacyRegistered ? "on" : "off"}) clicks=${legacyClickCount} | disposer(${modernRegistered ? "on" : "off"}) clicks=${modernClickCount}`
                );
            }}
        >
            <StatusIcon />
        </ChatBarButton>
    );
};

export default definePlugin({
    name: "DisposerDemo",
    description: "[Dev only] Demonstrates legacy remove* cleanup and new disposer cleanup side-by-side.",
    authors: [Devs.Ven],
    dependencies: ["MessageEventsAPI", "ChatInputButtonAPI"],
    get hidden() {
        return !IS_DEV;
    },

    chatBarButton: {
        render: DemoButton,
        icon: StatusIcon
    },

    start() {
        if (!IS_DEV) return;

        legacyClickCount = 0;
        modernClickCount = 0;

        legacyListener = message => {
            legacyClickCount++;
            showDemoToast(`Legacy listener fired for message ${message.id}`);
        };

        addMessageClickListener(legacyListener);
        legacyRegistered = true;

        disposeModernListener = addMessageClickListener(message => {
            modernClickCount++;
            showDemoToast(`Disposer listener fired for message ${message.id}`);
        });
        modernRegistered = true;

        showDemoToast("Registered listeners. Click messages, then click the chat button to view counters/state.");
    },

    stop() {
        if (legacyListener) {
            removeMessageClickListener(legacyListener);
            legacyListener = null;
        }

        if (disposeModernListener) {
            disposeModernListener();
            disposeModernListener = null;
        }

        legacyRegistered = false;
        modernRegistered = false;

        showDemoToast("Unregistered both listeners (legacy remove* + new disposer).");
    }
});
