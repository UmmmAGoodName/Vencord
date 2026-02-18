/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { MessagePopoverButtonComponentProps } from "@api/MessagePopover";
import { showNotification } from "@api/Notifications";
import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";
import { ChannelStore, useMemo, useState } from "@webpack/common";

function TestIcon({ height = 24, width = 24, className = "icon" }: { height?: number | string; width?: number | string; className?: string; }) {
    return (
        <svg
            className={className}
            height={height}
            width={width}
            viewBox="0 0 24 24"
            fill="currentColor"
        >
            <path d="M12 3a3 3 0 0 1 3 3v1.1a5.9 5.9 0 0 1 2.9 1.2l.8-.8a1 1 0 1 1 1.4 1.4l-.8.8A5.9 5.9 0 0 1 20.9 13H22a1 1 0 1 1 0 2h-1.1a5.9 5.9 0 0 1-1.2 2.9l.8.8a1 1 0 1 1-1.4 1.4l-.8-.8A5.9 5.9 0 0 1 15 20.9V22a1 1 0 1 1-2 0v-1.1a5.9 5.9 0 0 1-2.9-1.2l-.8.8a1 1 0 0 1-1.4-1.4l.8-.8A5.9 5.9 0 0 1 7.1 15H6a1 1 0 1 1 0-2h1.1a5.9 5.9 0 0 1 1.2-2.9l-.8-.8a1 1 0 0 1 1.4-1.4l.8.8A5.9 5.9 0 0 1 13 7.1V6a3 3 0 0 1-1-3Zm0 7a4 4 0 1 0 4 4 4 4 0 0 0-4-4Z" />
        </svg>
    );
}

function HookPopoverButton({ message, Button }: MessagePopoverButtonComponentProps) {
    const [clicks, setClicks] = useState(0);
    const label = useMemo(
        () => `Component Popover API Test (${clicks})`,
        [clicks]
    );

    const channel = ChannelStore.getChannel(message.channel_id);
    if (!channel) return null;

    return (
        <Button
            label={label}
            icon={TestIcon}
            message={message}
            channel={channel}
            onClick={() => {
                const nextCount = clicks + 1;
                setClicks(nextCount);
                showNotification({
                    title: "Component MessagePopover Integration",
                    body: `Hook-based component path works. Click count: ${nextCount}`,
                    noPersist: true
                });
            }}
        />
    );
}

export default definePlugin({
    name: "MessagePopoverComponentIntegrationTest",
    description: "Dev-only test plugin for messagePopoverButton.component integration",
    authors: [Devs.Ven],

    messagePopoverButton: {
        icon: TestIcon,
        component: HookPopoverButton
    }
});
