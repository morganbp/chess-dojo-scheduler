import {
    Button,
    Card,
    CardContent,
    CardHeader,
    Container,
    Divider,
    Link,
    Stack,
    Typography,
} from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2/Grid2';
import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useFreeTier } from '../auth/Auth';
import { useTutorial } from '../tutorial/TutorialContext';
import { TutorialName } from '../tutorial/tutorialNames';
import UpsellDialog, { RestrictedAction } from '../upsell/UpsellDialog';
import HelpItem from './HelpItem';
import SupportTicket from './SupportTicket';
import { faq } from './UnauthenticatedHelp';

const helpSections = [
    faq,
    {
        title: 'Account/Profile',
        items: [
            {
                title: 'I am stuck on the free tier even though I have subscribed',
                content: (
                    <>
                        Make sure that you subscribed with the same email address that you
                        are using to access the scoreboard. If you used different email
                        addresses, send a Discord message to @JackStenglein so that he can
                        link your email addresses and get you off the free tier.
                    </>
                ),
            },
            {
                title: 'How do I cancel my subscription?',
                content: (
                    <>
                        You can cancel at the bottom of the{' '}
                        <Link component={RouterLink} to='/profile/edit'>
                            profile editor
                        </Link>
                        .
                    </>
                ),
            },
            {
                title: 'How do I graduate?',
                content: (
                    <>
                        At the top of the{' '}
                        <Link component={RouterLink} to='/profile'>
                            Profile page
                        </Link>
                        , click the <strong>Graduate</strong> button. This will move you
                        to the graduates section on the scoreboard for your current
                        cohort, as well as add you to the list of recent graduates on the{' '}
                        <Link component={RouterLink} to='/newsfeed'>
                            Newsfeed
                        </Link>
                        .
                    </>
                ),
            },
            {
                title: 'How do I switch cohorts without graduating?',
                content: (
                    <>
                        In the{' '}
                        <Link component={RouterLink} to='/profile/edit'>
                            profile editor
                        </Link>
                        , choose a new cohort from the dropdown and then click save. This
                        will move you to the scoreboard for the new cohort, but will not
                        add you to the graduates section for the previous cohort nor add
                        you to the recent graduates on the{' '}
                        <Link component={RouterLink} to='/newsfeed'>
                            Newsfeed
                        </Link>
                        .
                    </>
                ),
            },
            {
                title: 'Why does my profile activity say "no time data"?',
                content: (
                    <>
                        When updating your training progress, add the amount of time you
                        worked on each requirement in order to get a pie chart of how you
                        are using your time.
                    </>
                ),
            },
        ],
    },
    {
        title: 'Program Requirements/Ratings',
        items: [
            {
                title: 'How do I update my progress in the training plan?',
                content: (
                    <>
                        At the bottom of the{' '}
                        <Link component={RouterLink} to='/profile'>
                            Profile page
                        </Link>
                        , select the <strong>Training Plan</strong> tab. From here, you
                        can see the training program requirements for each cohort. On the
                        requirement you'd like to complete, click the checkbox or pencil
                        icon in order to update your progress.
                    </>
                ),
            },
            {
                title: 'How do I see the details of a requirement in the training plan?',
                content: (
                    <>
                        At the bottom of the{' '}
                        <Link component={RouterLink} to='/profile'>
                            Profile page
                        </Link>
                        , select the <strong>Training Plan</strong> tab. From here, you
                        can see the training program requirements for each cohort. On the
                        requirement you'd like to learn more about, click{' '}
                        <strong>View More</strong>.
                    </>
                ),
            },
            {
                title: 'How do I update my ratings?',
                content: (
                    <>
                        Current ratings are updated automatically every 24 hours. If your
                        ratings are not updating, make sure that you have correctly set
                        your usernames/IDs in the{' '}
                        <Link component={RouterLink} to='/profile/edit'>
                            profile editor
                        </Link>
                        . If your usernames are correct and your ratings are still not
                        updating, please send a Discord message to @JackStenglein.
                    </>
                ),
            },
            {
                title: 'How do I switch to a different rating system?',
                content: (
                    <>
                        In the{' '}
                        <Link component={RouterLink} to='/profile/edit'>
                            profile editor
                        </Link>
                        , choose a new rating system from the dropdown and then click
                        save. This will update your rating system on the scoreboard for
                        your current cohort, but not for any that you have previously
                        graduated from.
                    </>
                ),
            },
            {
                title: "Why can't I find myself on the scoreboard?",
                content: (
                    <>
                        The scoreboard only displays users who have updated their progress
                        in the last month. If you cannot find yourself, update your
                        progress on one of the program requirements.
                    </>
                ),
            },
            {
                title: 'How do I find my DWZ ID?',
                content: (
                    <>
                        The DWZ ID is not the same as your ZPS-Nr. The DWZ ID can be found
                        by going to your player page and copying the ID from the URL. For
                        example, Vincent Keymer's page is located at
                        https://www.schachbund.de/spieler/10283283.html, so his DWZ ID is
                        10283283.
                    </>
                ),
            },
        ],
    },
    {
        title: 'Scheduling',
        items: [
            {
                title: "How do I book someone else's meeting?",
                content: (
                    <>
                        On the{' '}
                        <Link component={RouterLink} to='/calendar'>
                            Calendar page
                        </Link>
                        , click the meeting you would like to book. A popup will appear
                        containing a <strong>Book</strong> button at the bottom.
                    </>
                ),
            },
            {
                title: 'How do I create a meeting for others to book?',
                content: (
                    <>
                        On the{' '}
                        <Link component={RouterLink} to='/calendar'>
                            Calendar page
                        </Link>
                        , click a time slot on the calendar. This will open a popup where
                        you can specify the start/end times for your availability, the
                        types of meetings you are looking for, how many people can join
                        and which cohorts can join. When you have filled in this info,
                        click the <strong>Save</strong> button at the top of the screen.
                    </>
                ),
            },
            {
                title: 'How do I edit a meeting I previously created?',
                content: (
                    <>
                        On the{' '}
                        <Link component={RouterLink} to='/calendar'>
                            Calendar page
                        </Link>
                        , click on the meeting you would like to edit. A popup will appear
                        containing a pencil icon. Click the pencil icon in order to edit
                        your meeting.
                    </>
                ),
            },
            {
                title: 'How do I delete/cancel a meeting?',
                content: (
                    <>
                        Currently, canceling a booked meeting is only possible for a
                        1-on-1 meeting. In order to cancel a 1-on-1 meeting, click the
                        <strong>Cancel</strong> button at the top of the meeting details
                        page. In order to delete an availability that has not yet been
                        booked, go to the{' '}
                        <Link component={RouterLink} to='/calendar'>
                            Calendar page
                        </Link>
                        and click the availability you would like to delete. A popup will
                        appear containing a trash icon. Click the trash icon in order to
                        delete your availability.
                    </>
                ),
            },
        ],
    },
    {
        title: 'Game Database',
        items: [
            {
                title: 'How do I submit a game to the database?',
                content: (
                    <>
                        On the{' '}
                        <Link component={RouterLink} to='/games'>
                            Games page
                        </Link>
                        , click the Submit a Game button, or go directly to the{' '}
                        <Link component={RouterLink} to='/games/submit'>
                            Game Submission page
                        </Link>
                        . You can submit a game either through a Lichess Study link or
                        through manual entry. When submitting through a Lichess link, make
                        sure that your Lichess Study is public or unlisted.
                    </>
                ),
            },
            {
                title: 'How do I update my game?',
                content: (
                    <>
                        Go to the game you want to update. Change the moves and add
                        comments, symbols, and clock times as necessary. When you are
                        done, click the <strong>Save Icon</strong> below the board to save
                        your changes. Any comments on your game will remain.
                    </>
                ),
            },
            {
                title: 'How do I delete my game?',
                content: (
                    <>
                        Go to the game you want to delete. Click the{' '}
                        <strong>Trash Icon</strong> below the board to permanently delete
                        your game and any associated comments. For games submitted through
                        the old database (on chessdojo.shop), fill out the following form:{' '}
                        <Link
                            href='https://forms.gle/v3JMwxyLQw3LMA1Y9'
                            target='_blank'
                            rel='noreferrer'
                        >
                            https://forms.gle/v3JMwxyLQw3LMA1Y9
                        </Link>{' '}
                        instead.
                    </>
                ),
            },
            {
                title: "Why can't I find a game I am searching for?",
                content: (
                    <>
                        Many games were submitted through the old site and therefore are
                        not associated with this site's accounts. These games will not
                        appear on the user's profile page. Additionally, these games can
                        only be searched by the player name used in the PGN. For example,
                        if you are searching for the Chess.com username "AngryNaartjie"
                        but the PGN file has the player name as "Our Hero, Naartjie", then
                        you will not find the game.
                    </>
                ),
            },
            {
                title: 'How are games marked as featured?',
                content: (
                    <>
                        The sensei choose the games that are marked as featured. Featured
                        games are visible at the bottom of the{' '}
                        <Link component={RouterLink} to='/games'>
                            Games page
                        </Link>{' '}
                        for a month after being featured.
                    </>
                ),
            },
        ],
    },
];

const AuthenticatedHelp = () => {
    const navigate = useNavigate();
    const { setTutorialState } = useTutorial();
    const isFreeTier = useFreeTier();
    const [upsellDialogOpen, setUpsellDialogOpen] = useState(false);

    const onTutorial = (path: string, tutorialName: TutorialName) => {
        navigate(path);
        setTutorialState({ activeTutorial: tutorialName });
    };

    const onClickDiscord = () => {
        setUpsellDialogOpen(true);
    };

    const scrollToId = (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        e.stopPropagation();

        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView();
        }
    };

    return (
        <Container maxWidth='xl' sx={{ py: 4 }}>
            {isFreeTier && (
                <UpsellDialog
                    open={upsellDialogOpen}
                    onClose={setUpsellDialogOpen}
                    currentAction={RestrictedAction.JoinDiscord}
                />
            )}

            <Grid container columnSpacing={4}>
                <Grid md={3} sx={{ display: { xs: 'none', md: 'initial' } }}>
                    <Card
                        variant='outlined'
                        sx={{
                            position: 'sticky',
                            top: 'calc(80px + 32px)',
                            overflowY: 'scroll',
                            height: 'calc(100vh - 80px - 32px - 32px)',
                        }}
                    >
                        <CardHeader title='Table of Contents' />
                        <CardContent>
                            <Stack>
                                {helpSections.map((section) => (
                                    <>
                                        <Link
                                            key={section.title}
                                            href={`#${section.title}`}
                                            onClick={(e) => scrollToId(e, section.title)}
                                        >
                                            {section.title}
                                        </Link>
                                        <ul style={{ marginTop: 0 }}>
                                            {section.items.map((item) => (
                                                <li key={item.title}>
                                                    <Link
                                                        href={`#${item.title}`}
                                                        onClick={(e) =>
                                                            scrollToId(e, item.title)
                                                        }
                                                    >
                                                        {item.title}
                                                    </Link>
                                                </li>
                                            ))}
                                        </ul>
                                    </>
                                ))}
                                <Link
                                    href='#support-ticket'
                                    onClick={(e) => scrollToId(e, 'support-ticket')}
                                >
                                    Open a Support Ticket
                                </Link>
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid id='scroll-parent' md={9}>
                    <Stack spacing={5}>
                        <Stack>
                            <Typography variant='h4'>Help/FAQs</Typography>
                            <Divider />
                            <Typography variant='body1' mt={3}>
                                If you have trouble using the site, please check this
                                section before asking for help. If your issue is not
                                listed here or is not solved by the advice here, then send
                                a Discord message in the{' '}
                                <Link
                                    href={
                                        isFreeTier
                                            ? undefined
                                            : 'https://discord.com/channels/951958534113886238/1095403018607923281'
                                    }
                                    target='_blank'
                                    rel='noreferrer'
                                    onClick={isFreeTier ? onClickDiscord : undefined}
                                >
                                    Dojo Scoreboard Feedback Discord Channel.
                                </Link>
                            </Typography>
                        </Stack>

                        <Stack>
                            <Typography variant='h5'>Tutorials</Typography>
                            <Divider />
                            <ul>
                                <li>
                                    <Button
                                        onClick={() =>
                                            onTutorial(
                                                '/profile',
                                                TutorialName.ProfilePage,
                                            )
                                        }
                                        sx={{ textTransform: 'none' }}
                                    >
                                        Launch Profile Page Tutorial
                                    </Button>
                                </li>
                                <li>
                                    <Button
                                        onClick={() =>
                                            onTutorial(
                                                '/scoreboard',
                                                TutorialName.ScoreboardPage,
                                            )
                                        }
                                        sx={{ textTransform: 'none' }}
                                    >
                                        Launch Scoreboard Page Tutorial
                                    </Button>
                                </li>
                                <li>
                                    <Button
                                        onClick={() =>
                                            onTutorial(
                                                '/calendar',
                                                TutorialName.CalendarPage,
                                            )
                                        }
                                        sx={{ textTransform: 'none' }}
                                    >
                                        Launch Calendar Page Tutorial
                                    </Button>
                                </li>
                                <li>
                                    <Button
                                        onClick={() =>
                                            onTutorial(
                                                '/games',
                                                TutorialName.ListGamesPage,
                                            )
                                        }
                                        sx={{ textTransform: 'none' }}
                                    >
                                        Launch Games Page Tutorial
                                    </Button>
                                </li>
                            </ul>
                        </Stack>

                        {helpSections.map((section) => (
                            <Stack
                                key={section.title}
                                id={section.title}
                                sx={{
                                    scrollMarginTop: 'calc(var(--navbar-height) + 8px)',
                                }}
                            >
                                <Typography variant='h5'>{section.title}</Typography>
                                <Divider />

                                <Stack spacing={3} mt={3}>
                                    {section.items.map((item) => (
                                        <HelpItem key={item.title} title={item.title}>
                                            {item.content}
                                        </HelpItem>
                                    ))}
                                </Stack>
                            </Stack>
                        ))}

                        <SupportTicket />
                    </Stack>
                </Grid>
            </Grid>
        </Container>
    );
};

export default AuthenticatedHelp;
