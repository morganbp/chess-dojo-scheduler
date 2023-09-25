import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
} from '@mui/material';

export enum RestrictedAction {
    AccessAllTasks = 'Access all training plan tasks for all cohorts (0-2500)',
    AccessOpenings = 'Access all opening courses',
    AddCalendarEvents = 'Add events to the Dojo Calendar',
    SubmitGames = 'View the full Dojo Database and submit games',
    JoinScoreboard = 'Get added to the Dojo Scoreboard',
    JoinDiscord = 'Join the Training Program Discord server',
    Graduate = 'Graduate and get featured in the graduation shows on Twitch',
    DownloadDatabase = 'Download the full Dojo Database',
    SearchDatabase = 'Search the Dojo Database by player',
}

const defaultBulletPoints = [
    RestrictedAction.AccessAllTasks,
    RestrictedAction.AccessOpenings,
    RestrictedAction.AddCalendarEvents,
    RestrictedAction.SubmitGames,
    RestrictedAction.JoinScoreboard,
    RestrictedAction.JoinDiscord,
    RestrictedAction.Graduate,
];

export interface UpsellDialogProps {
    open: boolean;
    onClose: (value: boolean) => void;
    bulletPoints?: string[];
    currentAction?: string;
}

const UpsellDialog: React.FC<UpsellDialogProps> = ({
    open,
    onClose,
    bulletPoints = defaultBulletPoints,
    currentAction,
}) => {
    if (currentAction) {
        bulletPoints = [
            currentAction,
            ...bulletPoints.filter((bp) => bp !== currentAction),
        ];
    }

    return (
        <Dialog
            data-cy='upsell-dialog'
            maxWidth='sm'
            fullWidth
            open={open}
            onClose={() => onClose(false)}
        >
            <DialogTitle>Upgrade to a Full Account</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    You're currently on the free plan. Subscribe to the full training plan
                    to:
                </DialogContentText>
                <DialogContentText component='div'>
                    <ul>
                        {bulletPoints.slice(0, 6).map((item) => (
                            <li key={item}>{item}</li>
                        ))}
                        <li>And more!</li>
                    </ul>
                </DialogContentText>
                <DialogContentText>
                    Your progress on the free plan will be carried over when you
                    subscribe.
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => onClose(false)}>Cancel</Button>
                <Button
                    href='https://www.chessdojo.club/plans-pricing'
                    target='_blank'
                    rel='noreferrer'
                >
                    View Prices
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default UpsellDialog;