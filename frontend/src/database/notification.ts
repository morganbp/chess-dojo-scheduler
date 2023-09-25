/**
 * Represents the type of a Notification.
 */
export enum NotificationType {
    /** Notifications generated by comments on a game. */
    GameComment = 'GAME_COMMENT',
}

/**
 *  Data for a notification.
 */
export interface Notification {
    /** The id of the Notification. */
    id: string;

    /** The type of the Notification. */
    type: NotificationType;

    /** The time the Notification was last updated. */
    updatedAt: string;

    /** Metadata for a game comment Notification. */
    gameCommentMetadata?: {
        /** The cohort of the Game. */
        cohort: string;

        /** The id of the Game. */
        id: string;

        /** The headers of the Game. */
        headers: {
            [key: string]: string;
        };
    };
}

export function getTitle(notification: Notification): string {
    switch (notification.type) {
        case NotificationType.GameComment:
            return `${notification.gameCommentMetadata?.headers?.White} - ${notification.gameCommentMetadata?.headers?.Black}`;
    }
}

export function getDescription(notification: Notification): string {
    switch (notification.type) {
        case NotificationType.GameComment:
            return 'There are new comments on your game.';
    }
}
