/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { showNotification } from "@api/Notifications";
import { NoEntrySignIcon } from "@components/Icons";
import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";
import { ChannelStore } from "@webpack/common";

export default definePlugin({
    name: "MessagePopoverLegacyIntegrationTest",
    description: "Dev-only test plugin for legacy messagePopoverButton.render integration",
    authors: [Devs.Ven],

    messagePopoverButton: {
        icon: NoEntrySignIcon,
        render(message) {
            const channel = ChannelStore.getChannel(message.channel_id);
            if (!channel) return null;

            return {
                label: "Legacy Popover API Test",
                icon: NoEntrySignIcon,
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
