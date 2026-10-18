/*
 * Vencord, a Discord client mod
 * Copyright (c) 2023 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./styles.css";

import { classNameFactory } from "@utils/css";
import { getGuildAcronym, openImageModal, openUserProfile } from "@utils/discord";
import { classes } from "@utils/misc";
import { useAwaiter } from "@utils/react";
import { Guild, RenderModalProps, User } from "@vencord/discord-types";
import { findComponentByCodeLazy, findCssClassesLazy } from "@webpack";
import { FluxDispatcher, Forms, GuildChannelStore, GuildMemberStore, GuildRoleStore, GuildStore, IconUtils, Modal, openModal, Parser, PresenceStore, RelationshipStore, ScrollerThin, SnowflakeUtils, TabBar, Timestamp, useEffect, useMemo, UserStore, UserUtils, useState, useStateFromStores } from "@webpack/common";

const IconClasses = findCssClassesLazy("icon", "acronym", "childWrapper");
const FriendRow = findComponentByCodeLazy("discriminatorClass:", ".isMobileOnline", "avatarSrc:");

const cl = classNameFactory("vc-gp-");

const MAX_MEMBER_REQUESTS = 10;

export function openGuildInfoModal(guild: Guild) {
    openModal(props => <GuildInfoModal guild={guild} modalProps={props} />);
}

const enum Tabs {
    ServerInfo,
    Friends,
    MutualServers,
    BlockedUsers,
    IgnoredUsers
}

interface GuildProps {
    guild: Guild;
}

interface RelationshipProps extends GuildProps {
    setCount(count: number): void;
}

const fetched = {
    friends: false,
    blocked: false,
    ignored: false,
    mutual: false
};

function renderTimestamp(timestamp: number) {
    return (
        <Timestamp timestamp={new Date(timestamp)} />
    );
}

function GuildInfoModal({ guild, modalProps }: GuildProps & { modalProps: RenderModalProps; }) {
    const [friendCount, setFriendCount] = useState<number>();
    const [mutualCount, setMutualCount] = useState<number>();
    const [blockedCount, setBlockedCount] = useState<number>();
    const [ignoredCount, setIgnoredCount] = useState<number>();

    useEffect(() => {
        fetched.friends = false;
        fetched.blocked = false;
        fetched.ignored = false;
        fetched.mutual = false;
    }, []);

    const [currentTab, setCurrentTab] = useState(Tabs.ServerInfo);

    const bannerUrl = guild.banner && IconUtils.getGuildBannerURL(guild, true)!.replace(/\?size=\d+$/, "?size=1024");

    const iconUrl = guild.icon && IconUtils.getGuildIconURL({
        id: guild.id,
        icon: guild.icon,
        canAnimate: true,
        size: 512
    });

    return (
        <Modal
            {...modalProps}
            size="lg"
            title={
                <div className={cl("header")}>
                    {iconUrl
                        ? <img
                            className={cl("icon")}
                            src={iconUrl}
                            alt=""
                            onClick={() => openImageModal({
                                url: iconUrl,
                                height: 512,
                                width: 512,
                            })}
                        />
                        : <div aria-hidden className={classes(IconClasses.childWrapper, IconClasses.acronym)}>{getGuildAcronym(guild)}</div>
                    }

                    <div className={cl("name-and-description")}>
                        <Forms.FormTitle tag="h5" className={cl("name")}>{guild.name}</Forms.FormTitle>
                        {guild.description && <Forms.FormText>{guild.description}</Forms.FormText>}
                    </div>
                </div>
            }
        >
            {bannerUrl && currentTab === Tabs.ServerInfo && (
                <img
                    className={cl("banner")}
                    src={bannerUrl}
                    alt=""
                    onClick={() => openImageModal({
                        url: bannerUrl,
                        width: 1024
                    })}
                />
            )}

            <TabBar
                type="top"
                look="brand"
                className={cl("tab-bar")}
                selectedItem={currentTab}
                onItemSelect={setCurrentTab}
            >
                <TabBar.Item
                    className={cl("tab", { selected: currentTab === Tabs.ServerInfo })}
                    id={Tabs.ServerInfo}
                >
                    Server Info
                </TabBar.Item>
                <TabBar.Item
                    className={cl("tab", { selected: currentTab === Tabs.Friends })}
                    id={Tabs.Friends}
                >
                    Friends{friendCount !== undefined ? ` (${friendCount})` : ""}
                </TabBar.Item>
                <TabBar.Item
                    className={cl("tab", { selected: currentTab === Tabs.MutualServers })}
                    id={Tabs.MutualServers}
                >
                    Mutual Servers{mutualCount !== undefined ? ` (${mutualCount})` : ""}
                </TabBar.Item>
                <TabBar.Item
                    className={cl("tab", { selected: currentTab === Tabs.BlockedUsers })}
                    id={Tabs.BlockedUsers}
                >
                    Blocked Users{blockedCount !== undefined ? ` (${blockedCount})` : ""}
                </TabBar.Item>
                <TabBar.Item
                    className={cl("tab", { selected: currentTab === Tabs.IgnoredUsers })}
                    id={Tabs.IgnoredUsers}
                >
                    Ignored Users{ignoredCount !== undefined ? ` (${ignoredCount})` : ""}
                </TabBar.Item>
            </TabBar>

            <div className={cl("tab-content")}>
                {currentTab === Tabs.ServerInfo && <ServerInfoTab guild={guild} />}
                {currentTab === Tabs.Friends && <FriendsTab guild={guild} setCount={setFriendCount} />}
                {currentTab === Tabs.MutualServers && <MutualServersTab guild={guild} setCount={setMutualCount} />}
                {currentTab === Tabs.BlockedUsers && <BlockedUsersTab guild={guild} setCount={setBlockedCount} />}
                {currentTab === Tabs.IgnoredUsers && <IgnoredUserTab guild={guild} setCount={setIgnoredCount} />}
            </div>
        </Modal>
    );
}


function Owner(guildId: string, owner: User) {
    const guildAvatar = GuildMemberStore.getMember(guildId, owner.id)?.avatar;
    const ownerAvatarUrl =
        guildAvatar
            ? IconUtils.getGuildMemberAvatarURLSimple({
                userId: owner!.id,
                avatar: guildAvatar,
                guildId,
                canAnimate: true
            })
            : IconUtils.getUserAvatarURL(owner, true);

    return (
        <div className={cl("owner")}>
            <img
                className={cl("owner-avatar")}
                src={ownerAvatarUrl}
                alt=""
                onClick={() => openImageModal({
                    url: ownerAvatarUrl,
                    height: 512,
                    width: 512
                })}
            />
            {Parser.parse(`<@${owner.id}>`)}
        </div>
    );
}

function ServerInfoTab({ guild }: GuildProps) {
    const [owner] = useAwaiter(() => UserUtils.getUser(guild.ownerId), {
        deps: [guild.ownerId],
        fallbackValue: null
    });

    const Fields = {
        "Server Owner": owner ? Owner(guild.id, owner) : "Loading...",
        "Created At": renderTimestamp(SnowflakeUtils.extractTimestamp(guild.id)),
        "Joined At": guild.joinedAt ? renderTimestamp(guild.joinedAt.getTime()) : "-", // Not available in lurked guild
        "Vanity Link": guild.vanityURLCode ? (<a>{`discord.gg/${guild.vanityURLCode}`}</a>) : "-", // Making the anchor href valid would cause Discord to reload
        "Preferred Locale": guild.preferredLocale || "-",
        "Verification Level": ["None", "Low", "Medium", "High", "Highest"][guild.verificationLevel] || "?",
        "Server Boosts": `${guild.premiumSubscriberCount ?? 0} (Level ${guild.premiumTier ?? 0})`,
        "Channels": GuildChannelStore.getChannels(guild.id)?.count - 1 || "?", // - null category
        "Roles": GuildRoleStore.getSortedRoles(guild.id).length - 1, // - @everyone
    };

    return (
        <div className={cl("info")}>
            {Object.entries(Fields).map(([name, node]) =>
                <div className={cl("server-info-pair")} key={name}>
                    <Forms.FormTitle tag="h5">{name}</Forms.FormTitle>
                    {typeof node === "string" ? <span>{node}</span> : node}
                </div>
            )}
        </div>
    );
}

function FriendsTab({ guild, setCount }: RelationshipProps) {
    return UserList("friends", guild, RelationshipStore.getFriendIDs(), setCount);
}

function BlockedUsersTab({ guild, setCount }: RelationshipProps) {
    const blockedIds = RelationshipStore.getBlockedIDs();
    return UserList("blocked", guild, blockedIds, setCount);
}

function GuildIcon({ guild }: GuildProps) {
    const iconUrl = guild.icon && IconUtils.getGuildIconURL({
        id: guild.id,
        icon: guild.icon,
        canAnimate: false,
        size: 32
    });

    return (
        <div className={cl("mutual-guild")} title={guild.name}>
            {iconUrl
                ? <img className={cl("mutual-guild-icon")} src={iconUrl} alt="" />
                : <div className={classes(cl("mutual-guild-icon"), cl("mutual-guild-acronym"))}>{getGuildAcronym(guild)}</div>
            }
        </div>
    );
}

function MutualServerRow({ guild, user, guilds }: GuildProps & { user: User; guilds: Guild[]; }) {
    const nick = GuildMemberStore.getNick(guild.id, user.id);
    const displayName = user.globalName || user.username;

    return (
        <div
            className={cl("mutual-row")}
            role="button"
            tabIndex={0}
            onClick={() => openUserProfile(user.id)}
            onKeyDown={e => { if (e.key === "Enter") openUserProfile(user.id); }}
        >
            <img className={cl("mutual-avatar")} src={IconUtils.getUserAvatarURL(user, true, 64)} alt="" />
            <div className={cl("mutual-names")}>
                <span className={cl("mutual-name")}>{nick || displayName}</span>
                {(nick || displayName) !== user.username && (
                    <span className={cl("mutual-username")}>{user.username}</span>
                )}
            </div>
            <div className={cl("mutual-guilds")}>
                {guilds.map(g => <GuildIcon key={g.id} guild={g} />)}
            </div>
        </div>
    );
}

function MutualServersTab({ guild, setCount }: RelationshipProps) {
    // Used for side effects (rerender on member request success)
    const memberVersion = useStateFromStores([GuildMemberStore], () => GuildMemberStore.getMemberVersion());

    // Request members known from other guilds so their membership here can be checked
    useEffect(() => {
        if (fetched.mutual) return;
        fetched.mutual = true;

        const selfId = UserStore.getCurrentUser()?.id;
        const candidates = new Set<string>();
        for (const [guildId, members] of Object.entries(GuildMemberStore.getMutableAllGuildsAndMembers())) {
            if (guildId === guild.id) continue;
            for (const userId of Object.keys(members)) {
                if (userId !== selfId && !GuildMemberStore.isMember(guild.id, userId))
                    candidates.add(userId);
            }
        }

        // Gateway requests take at most 100 ids each; cap the total to avoid flooding it
        const ids = [...candidates].slice(0, 100 * MAX_MEMBER_REQUESTS);
        for (let i = 0; i < ids.length; i += 100) {
            FluxDispatcher.dispatch({
                type: "GUILD_MEMBERS_REQUEST",
                guildIds: [guild.id],
                userIds: ids.slice(i, i + 100)
            });
        }
    }, []);

    const entries = useMemo(() => {
        const selfId = UserStore.getCurrentUser()?.id;
        const result: { user: User; guilds: Guild[]; }[] = [];

        for (const userId of GuildMemberStore.getMemberIds(guild.id)) {
            if (userId === selfId) continue;

            const user = UserStore.getUser(userId);
            if (!user || user.bot) continue;

            const guilds = GuildMemberStore.memberOf(userId)
                .filter(id => id !== guild.id)
                .map(id => GuildStore.getGuild(id))
                .filter(Boolean)
                .sort((a, b) => a.name.localeCompare(b.name));

            if (guilds.length)
                result.push({ user, guilds });
        }

        return result.sort((a, b) => b.guilds.length - a.guilds.length);
    }, [guild.id, memberVersion]);

    useEffect(() => setCount(entries.length), [entries.length]);

    return (
        <ScrollerThin fade className={cl("scroller")}>
            {entries.map(({ user, guilds }) =>
                <MutualServerRow key={user.id} guild={guild} user={user} guilds={guilds} />
            )}
        </ScrollerThin>
    );
}

function IgnoredUserTab({ guild, setCount }: RelationshipProps) {
    const ignoredIds = RelationshipStore.getIgnoredIDs();
    return UserList("ignored", guild, ignoredIds, setCount);
}


function UserList(type: "friends" | "blocked" | "ignored", guild: Guild, ids: string[], setCount: (count: number) => void) {
    const missing = [] as string[];
    const members = [] as string[];

    for (const id of ids) {
        if (GuildMemberStore.isMember(guild.id, id))
            members.push(id);
        else
            missing.push(id);
    }

    // Used for side effects (rerender on member request success)
    useStateFromStores(
        [GuildMemberStore],
        () => GuildMemberStore.getMemberIds(guild.id),
        null,
        (old, curr) => old.length === curr.length
    );

    useEffect(() => {
        if (!fetched[type] && missing.length) {
            fetched[type] = true;
            FluxDispatcher.dispatch({
                type: "GUILD_MEMBERS_REQUEST",
                guildIds: [guild.id],
                userIds: missing
            });
        }
    }, []);

    useEffect(() => setCount(members.length), [members.length]);

    return (
        <ScrollerThin fade className={cl("scroller")}>
            {members.map(id =>
                <FriendRow
                    key={id}
                    user={UserStore.getUser(id)}
                    status={PresenceStore.getStatus(id) || "offline"}
                    onSelect={() => openUserProfile(id)}
                    onContextMenu={() => { }}
                />
            )}
        </ScrollerThin>
    );
}
