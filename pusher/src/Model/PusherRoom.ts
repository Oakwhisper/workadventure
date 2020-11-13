import {PointInterface} from "./Websocket/PointInterface";
import {Group} from "./Group";
import {User} from "./User";
import {ExSocketInterface} from "_Model/Websocket/ExSocketInterface";
import {PositionInterface} from "_Model/PositionInterface";
import {Identificable} from "_Model/Websocket/Identificable";
import {PositionDispatcher} from "./PositionDispatcher";
import {ViewportInterface} from "_Model/Websocket/ViewportMessage";
import {Movable} from "_Model/Movable";
import {extractDataFromPrivateRoomId, extractRoomSlugPublicRoomId, isRoomAnonymous} from "./RoomIdentifier";
import {arrayIntersect} from "../Services/ArrayHelper";
import {MAX_USERS_PER_ROOM} from "../Enum/EnvironmentVariable";
import {ZoneEventListener} from "_Model/Zone";

export type ConnectCallback = (user: User, group: Group) => void;
export type DisconnectCallback = (user: User, group: Group) => void;

export enum GameRoomPolicyTypes {
    ANONYMUS_POLICY = 1,
    MEMBERS_ONLY_POLICY,
    USE_TAGS_POLICY,
}

export class PusherRoom {
    private readonly positionNotifier: PositionDispatcher;
    public readonly anonymous: boolean;
    public tags: string[];
    public policyType: GameRoomPolicyTypes;
    public readonly roomSlug: string;
    public readonly worldSlug: string = '';
    public readonly organizationSlug: string = '';

    constructor(public readonly roomId: string,
                private socketListener: ZoneEventListener)
    {
        this.anonymous = isRoomAnonymous(roomId);
        this.tags = [];
        this.policyType = GameRoomPolicyTypes.ANONYMUS_POLICY;

        if (this.anonymous) {
            this.roomSlug = extractRoomSlugPublicRoomId(this.roomId);
        } else {
            const {organizationSlug, worldSlug, roomSlug} = extractDataFromPrivateRoomId(this.roomId);
            this.roomSlug = roomSlug;
            this.organizationSlug = organizationSlug;
            this.worldSlug = worldSlug;
        }

        // A zone is 10 sprites wide.
        this.positionNotifier = new PositionDispatcher(this.roomId, 320, 320, this.socketListener);
    }

    public setViewport(socket : ExSocketInterface, viewport: ViewportInterface): void {
        this.positionNotifier.setViewport(socket, viewport);
    }

    public leave(socket : ExSocketInterface){
        this.positionNotifier.removeViewport(socket);
    }

    public canAccess(userTags: string[]): boolean {
        return arrayIntersect(userTags, this.tags);
    }

    public isEmpty(): boolean {
        return this.positionNotifier.isEmpty();
    }
}
