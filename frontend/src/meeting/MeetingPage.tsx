import { useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import {
    Container,
    Stack,
    Card,
    CardHeader,
    CardContent,
    Typography,
    Alert,
    Button,
    Dialog,
    DialogContent,
    DialogTitle,
    DialogContentText,
    DialogActions,
    IconButton,
    Link,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { LoadingButton } from '@mui/lab';

import { useApi } from '../api/Api';
import { RequestSnackbar, useRequest } from '../api/Request';
import { AvailabilityStatus, Participant, getDisplayString } from '../database/event';
import GraduationIcon from '../scoreboard/GraduationIcon';
import { useCache } from '../api/cache/Cache';
import LoadingPage from '../loading/LoadingPage';
import { useAuth } from '../auth/Auth';
import { EventType, trackEvent } from '../analytics/events';

const MeetingPage = () => {
    const { meetingId } = useParams();
    const cache = useCache();
    const user = useAuth().user!;

    const api = useApi();
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const cancelRequest = useRequest();

    const meeting = cache.events.get(meetingId!);
    if (!meeting) {
        if (cache.isLoading) {
            return <LoadingPage />;
        }

        return (
            <Container sx={{ pt: 6, pb: 4 }}>
                <Typography variant='subtitle2'>Meeting not found</Typography>
            </Container>
        );
    }
    console.log('Meeting: ', meeting);

    const onCancel = () => {
        cancelRequest.onStart();

        api.cancelEvent(meetingId!)
            .then((response) => {
                console.log('Cancel meeting response: ', response);
                trackEvent(EventType.CancelMeeting, {
                    meeting_id: meetingId,
                });
                cache.events.put(response.data);
                cancelRequest.onSuccess();
                setShowCancelDialog(false);
            })
            .catch((err) => {
                console.error(err);
                cancelRequest.onFailure(err);
            });
    };

    const start = new Date(meeting.bookedStartTime || meeting.startTime);
    const startDate = start.toLocaleDateString();
    const startTime = start.toLocaleTimeString();

    let opponent: Participant = meeting.participants![0];
    if (opponent.username === user.username) {
        opponent = {
            username: meeting.owner,
            displayName: meeting.ownerDisplayName,
            cohort: meeting.ownerCohort,
            previousCohort: meeting.ownerPreviousCohort,
        };
    }

    return (
        <Container maxWidth='md' sx={{ pt: 4, pb: 4 }}>
            <Dialog
                open={showCancelDialog}
                onClose={
                    cancelRequest.isLoading()
                        ? undefined
                        : () => setShowCancelDialog(false)
                }
            >
                <RequestSnackbar request={cancelRequest} />
                <DialogTitle>
                    Cancel this meeting?
                    <IconButton
                        aria-label='close'
                        onClick={() => setShowCancelDialog(false)}
                        sx={{
                            position: 'absolute',
                            right: 10,
                            top: 8,
                        }}
                        disabled={cancelRequest.isLoading()}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to cancel this meeting? You can't undo this
                        action.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <LoadingButton onClick={onCancel} loading={cancelRequest.isLoading()}>
                        Cancel Meeting
                    </LoadingButton>
                </DialogActions>
            </Dialog>

            <Stack spacing={4}>
                {meeting.status === AvailabilityStatus.Canceled && (
                    <Alert severity='error'>This meeting has been canceled.</Alert>
                )}

                <Card variant='outlined'>
                    <CardHeader
                        title={
                            <Stack
                                direction='row'
                                justifyContent='space-between'
                                flexWrap='wrap'
                                rowGap={1}
                            >
                                <Typography variant='h5' mr={1}>
                                    Meeting Details
                                </Typography>

                                {meeting.status !== AvailabilityStatus.Canceled && (
                                    <Button
                                        variant='contained'
                                        color='error'
                                        onClick={() => setShowCancelDialog(true)}
                                    >
                                        Cancel Meeting
                                    </Button>
                                )}
                            </Stack>
                        }
                    />
                    <CardContent>
                        <Stack spacing={3}>
                            <Stack>
                                <Typography variant='subtitle2' color='text.secondary'>
                                    Start Time
                                </Typography>
                                <Typography variant='body1'>
                                    {startDate} {startTime}
                                </Typography>
                            </Stack>

                            <Stack>
                                <Typography variant='subtitle2' color='text.secondary'>
                                    Meeting Type
                                </Typography>
                                <Typography variant='body1'>
                                    {getDisplayString(meeting.bookedType)}
                                </Typography>
                            </Stack>

                            <Stack>
                                <Typography variant='subtitle2' color='text.secondary'>
                                    Location
                                </Typography>
                                <Typography variant='body1'>
                                    {meeting.location || 'Discord'}
                                </Typography>
                            </Stack>

                            {meeting.description && (
                                <Stack>
                                    <Typography
                                        variant='subtitle2'
                                        color='text.secondary'
                                    >
                                        Description
                                    </Typography>
                                    <Typography
                                        variant='body1'
                                        style={{ whiteSpace: 'pre-line' }}
                                    >
                                        {meeting.description}
                                    </Typography>
                                </Stack>
                            )}
                        </Stack>
                    </CardContent>
                </Card>

                <Card variant='outlined'>
                    <CardHeader title='Opponent' />
                    <CardContent>
                        <Stack spacing={3}>
                            <Stack>
                                <Typography variant='subtitle2' color='text.secondary'>
                                    Name
                                </Typography>
                                <Stack direction='row' spacing={2} alignItems='center'>
                                    <Link
                                        component={RouterLink}
                                        to={`/profile/${opponent.username}`}
                                    >
                                        <Typography variant='body1'>
                                            {opponent.displayName}
                                        </Typography>
                                    </Link>
                                    <GraduationIcon
                                        cohort={opponent.previousCohort}
                                        size={25}
                                    />
                                </Stack>
                            </Stack>

                            <Stack>
                                <Typography variant='subtitle2' color='text.secondary'>
                                    Chess Dojo Cohort
                                </Typography>
                                <Typography variant='body1'>{opponent.cohort}</Typography>
                            </Stack>
                        </Stack>
                    </CardContent>
                </Card>
            </Stack>
        </Container>
    );
};

export default MeetingPage;
