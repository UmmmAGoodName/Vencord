/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { MessagePopoverButtonComponentProps } from "@api/MessagePopover";
import { showNotification } from "@api/Notifications";
import { PlusIcon } from "@components/Icons";
import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";
import { ChannelStore, useMemo, useState } from "@webpack/common";

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
            icon={PlusIcon}
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
        icon: PlusIcon,
        component: HookPopoverButton
    }
});
