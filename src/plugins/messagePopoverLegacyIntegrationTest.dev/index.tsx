/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { showNotification } from "@api/Notifications";
import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";
import { ChannelStore } from "@webpack/common";

function TestIcon({ height = 24, width = 24, className = "icon" }: { height?: number | string; width?: number | string; className?: string; }) {
    return (
        <svg
            className={className}
            height={height}
            width={width}
            viewBox="0 0 24 24"
            fill="currentColor"
        >
            <path d="M12 2a10 10 0 1 0 10 10A10.01 10.01 0 0 0 12 2Zm0 14a1 1 0 0 1-1-1V8a1 1 0 0 1 2 0v7a1 1 0 0 1-1 1Zm0 4a1.25 1.25 0 1 1 1.25-1.25A1.25 1.25 0 0 1 12 20Z" />
        </svg>
    );
}

export default definePlugin({
    name: "MessagePopoverLegacyIntegrationTest",
    description: "Dev-only test plugin for legacy messagePopoverButton.render integration",
    authors: [Devs.Ven],

    messagePopoverButton: {
        icon: TestIcon,
        render(message) {
            const channel = ChannelStore.getChannel(message.channel_id);
            if (!channel) return null;

            return {
                label: "Legacy Popover API Test",
                icon: TestIcon,
                message,
                channel,
                onClick: () => showNotification({
                    title: "Legacy MessagePopover Integration",
                    body: "Legacy render(message) path is working",
                    noPersist: true
                })
            };
        }
    }
});
