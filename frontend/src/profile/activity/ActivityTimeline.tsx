import { useFilters } from '@/calendar/filters/CalendarFilters';
import { DefaultTimezone } from '@/calendar/filters/TimezoneSelector';
import { RequirementCategory } from '@/database/requirement';
import { CategoryColors } from '@/style/ThemeProvider';
import { Scheduler } from '@aldabil/react-scheduler';
import { ProcessedEvent } from '@aldabil/react-scheduler/types';
import { CalendarMonth, FormatListBulleted } from '@mui/icons-material';
import {
    Box,
    Card,
    CardContent,
    Stack,
    ToggleButton,
    ToggleButtonGroup,
    Tooltip,
    Typography,
} from '@mui/material';
import { useMemo, useState } from 'react';
import { Request, RequestSnackbar } from '../../api/Request';
import { TimelineEntry, TimelineSpecialRequirementId } from '../../database/timeline';
import { TimeFormat, User } from '../../database/user';
import LoadingPage from '../../loading/LoadingPage';
import NewsfeedItem from '../../newsfeed/detail/NewsfeedItem';
import NewsfeedItemHeader from '../../newsfeed/detail/NewsfeedItemHeader';
import LoadMoreButton from '../../newsfeed/list/LoadMoreButton';
import { UseTimelineResponse } from './useTimeline';

export function getTimeSpent(timelineItem: TimelineEntry): string {
    if (timelineItem.minutesSpent === 0) {
        return '';
    }
    const hours = Math.floor(timelineItem.minutesSpent / 60);
    const minutes = timelineItem.minutesSpent % 60;
    if (hours === 0 && minutes === 0) {
        return '';
    }
    return `${hours}h ${minutes}m`;
}

const CreatedAtItem: React.FC<{ user: User }> = ({ user }) => {
    if (!user.createdAt) {
        return null;
    }

    const entry = {
        id: 'createdAt',
        owner: user.username,
        ownerDisplayName: user.displayName,
        createdAt: user.createdAt,
        requirementId: 'CreatedAt',
        requirementName: 'CreatedAt',
        requirementCategory: RequirementCategory.Welcome,
        cohort:
            user.graduationCohorts && user.graduationCohorts.length > 0
                ? user.graduationCohorts[0]
                : user.dojoCohort,
    };

    return (
        <Card variant='outlined'>
            <CardContent>
                <Stack>
                    <NewsfeedItemHeader entry={entry as TimelineEntry} />
                    <Typography>Joined the Dojo!</Typography>
                </Stack>
            </CardContent>
        </Card>
    );
};

interface ActivityTimelineProps {
    user: User;
    timeline: UseTimelineResponse;
}

const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ user, timeline }) => {
    const { request, entries, hasMore, onLoadMore, onEdit } = timeline;
    const [numShown, setNumShown] = useState(25);
    const [view, setView] = useState('list');

    if (request.isLoading() && entries.length === 0) {
        return (
            <Stack mt={2}>
                <Typography variant='h5' alignSelf='start'>
                    Timeline
                </Typography>
                <LoadingPage />
            </Stack>
        );
    }

    const handleLoadMore = () => {
        if (numShown < entries.length) {
            setNumShown(numShown + 25);
        } else {
            onLoadMore();
        }
    };

    return (
        <Stack mt={2} spacing={2}>
            <Stack direction='row' alignItems='center' spacing={2}>
                <Typography variant='h5'>Timeline</Typography>

                <ToggleButtonGroup size='small' value={view}>
                    <Tooltip title='List'>
                        <ToggleButton value='list' onClick={() => setView('list')}>
                            <FormatListBulleted />
                        </ToggleButton>
                    </Tooltip>

                    <Tooltip title='Calendar'>
                        <ToggleButton
                            value='calendar'
                            onClick={() => setView('calendar')}
                        >
                            <CalendarMonth />
                        </ToggleButton>
                    </Tooltip>
                </ToggleButtonGroup>
            </Stack>

            {entries.length === 0 ? (
                <Typography>No events yet</Typography>
            ) : view === 'list' ? (
                <ActivityTimelineList
                    user={user}
                    entries={entries}
                    numShown={numShown}
                    onEdit={onEdit}
                    hasMore={hasMore}
                    handleLoadMore={handleLoadMore}
                    request={request}
                />
            ) : (
                <ActivityTimelineCalendar user={user} timeline={timeline} />
            )}

            <RequestSnackbar request={request} />
        </Stack>
    );
};

const ActivityTimelineList = ({
    user,
    entries,
    numShown,
    onEdit,
    hasMore,
    handleLoadMore,
    request,
}: {
    user: User;
    entries: TimelineEntry[];
    numShown: number;
    onEdit: (i: number, e: TimelineEntry) => void;
    hasMore: boolean;
    handleLoadMore: () => void;
    request: Request;
}) => {
    return (
        <Stack spacing={3}>
            {entries.slice(0, numShown).map((entry, i) => (
                <NewsfeedItem
                    key={entry.id}
                    entry={entry}
                    onEdit={(e) => onEdit(i, e)}
                    maxComments={3}
                />
            ))}

            {(hasMore || numShown < entries.length) && (
                <LoadMoreButton
                    onLoadMore={handleLoadMore}
                    hasMore={hasMore || numShown < entries.length}
                    request={request}
                />
            )}

            <CreatedAtItem user={user} />
        </Stack>
    );
};

const ActivityTimelineCalendar = ({
    user,
    timeline,
}: {
    user: User;
    timeline: UseTimelineResponse;
}) => {
    const filters = useFilters();
    const { entries, hasMore, onLoadMore, onEdit } = timeline;

    const events: ProcessedEvent[] = useMemo(() => {
        const events: ProcessedEvent[] = entries.map((entry) => {
            const date = new Date(entry.createdAt);
            const category =
                entry.requirementId === TimelineSpecialRequirementId.GameSubmission
                    ? RequirementCategory.Games
                    : entry.requirementCategory;

            return {
                event_id: entry.id,
                title: getName(entry),
                start: date,
                end: date,
                allDay: true,
                color: CategoryColors[category],
                entry,
            };
        });

        if (user.createdAt) {
            events.push({
                event_id: 'createdAt',
                title: 'Joined the Dojo',
                start: new Date(user.createdAt),
                end: new Date(user.createdAt),
                allDay: true,
                color: CategoryColors[RequirementCategory.Welcome],
                user,
            });
        }

        return events;
    }, [entries, user]);

    const onSelectedDateChange = (date: Date) => {
        if (
            entries.length > 0 &&
            date.toISOString() < entries[entries.length - 1].createdAt &&
            hasMore
        ) {
            console.log('Loading more');
            onLoadMore();
        }
    };

    return (
        <Box
            sx={{
                '& div:has(> .rs__time)': {
                    gridTemplateColumns: 'repeat(7, 1fr) !important',
                },
                '& div:has(> .rs__today_cell):not(:has(> .rs__time))': {
                    gridTemplateColumns: '1fr !important',
                    '& span:first-child': { display: 'none !important' },
                },
                '& .rs__time': { display: 'none !important' },
            }}
        >
            <Scheduler
                events={events}
                view='month'
                agenda={false}
                month={{
                    weekDays: [0, 1, 2, 3, 4, 5, 6],
                    weekStartOn: filters.weekStartOn,
                    startHour: 0,
                    endHour: 24,
                }}
                week={{
                    weekDays: [0, 1, 2, 3, 4, 5, 6],
                    weekStartOn: filters.weekStartOn,
                    startHour: 0,
                    endHour: 0,
                    step: 0,
                }}
                day={{
                    startHour: 0,
                    endHour: 0,
                    step: 0,
                }}
                hourFormat={filters.timeFormat || TimeFormat.TwelveHour}
                timeZone={
                    filters.timezone === DefaultTimezone ? undefined : filters.timezone
                }
                editable={false}
                customViewer={(event) =>
                    event.entry ? (
                        <NewsfeedItem
                            entry={event.entry as TimelineEntry}
                            onEdit={(e) =>
                                onEdit(entries.indexOf(event.entry as TimelineEntry), e)
                            }
                            maxComments={3}
                        />
                    ) : event.user ? (
                        <CreatedAtItem user={event.user as User} />
                    ) : (
                        <></>
                    )
                }
                navigationPickerProps={{
                    disableFuture: true,
                    minDate: new Date('2023-05-01'),
                }}
                onSelectedDateChange={onSelectedDateChange}
            />
        </Box>
    );
};

function getName(entry: TimelineEntry): string {
    if (entry.requirementId === TimelineSpecialRequirementId.GameSubmission) {
        return 'Published Game';
    }

    if (entry.requirementId === TimelineSpecialRequirementId.Graduation) {
        return `Graduation: ${entry.cohort}`;
    }

    return entry.requirementName;
}

export default ActivityTimeline;
