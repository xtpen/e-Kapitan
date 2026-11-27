import { describe, expect, it } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';

/*
 * Main resident flows, end to end in a simulated browser: sign in, move around, go back,
 * fix a returned request, switch language, and the guided tour. Motion is reduced so pages
 * swap quickly.
 */

const setPrefs = (p: Record<string, unknown>) =>
  localStorage.setItem('ekapitan:preferences', JSON.stringify({ reduceMotion: true, tour: false, ...p }));

const signIn = async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getAllByRole('button', { name: 'Sign in' })[0]);
  const dialog = await screen.findByRole('dialog');
  await user.type(within(dialog).getByLabelText(/email or mobile number/i), 'maria@email.ph');
  await user.type(within(dialog).getByLabelText(/^password/i), 'secret12');
  await user.click(within(dialog).getByRole('button', { name: 'Sign in' }));
  return user;
};

/** The current page's title (waits out the page swap and the first-visit skeleton). */
const pageTitle = (name: string | RegExp) => screen.findByRole('heading', { level: 1, name }, { timeout: 6000 });
const navButton = (name: RegExp) => screen.getAllByRole('button', { name })[0];

describe('seed accounts', () => {
  const signInAs = async (email: string) => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getAllByRole('button', { name: 'Sign in' })[0]);
    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByLabelText(/email or mobile number/i), email);
    await user.type(within(dialog).getByLabelText(/^password/i), 'secret12');
    await user.click(within(dialog).getByRole('button', { name: 'Sign in' }));
    return user;
  };

  it('admin gets the admin portal without user management', async () => {
    setPrefs({});
    await signInAs('admin@ekapitan.local');
    expect(await screen.findAllByRole('button', { name: /Document requests/i }, { timeout: 6000 })).not.toHaveLength(0);
    expect(screen.queryByRole('button', { name: /Users & permissions/ })).not.toBeInTheDocument();
  });

  it('admin has sign out, notifications, account and settings in the navigation', async () => {
    setPrefs({});
    const user = await signInAs('admin@ekapitan.local');
    await screen.findAllByRole('button', { name: /Document requests/i }, { timeout: 6000 });
    expect(screen.getAllByRole('button', { name: /^Sign out$/ }).length).toBeGreaterThan(0);

    await user.click(screen.getAllByRole('button', { name: /^Notifications/ })[0]);
    expect(await screen.findByRole('heading', { level: 1, name: 'Notifications' }, { timeout: 6000 })).toBeInTheDocument();

    await user.click(screen.getAllByRole('button', { name: /^My account/ })[0]);
    expect(await screen.findByRole('heading', { level: 1, name: 'My account' }, { timeout: 6000 })).toBeInTheDocument();
    expect(screen.getAllByText('Juan Carlos T. Ramos').length).toBeGreaterThan(0);

    await user.click(screen.getAllByRole('button', { name: /^Settings/ })[0]);
    expect(await screen.findByRole('heading', { level: 1, name: 'Settings' }, { timeout: 6000 })).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: 'Sample data' })).toBeInTheDocument();
  });

  it('shows insights on the Overview and builds reports that export', async () => {
    setPrefs({});
    const user = await signInAs('admin@ekapitan.local');
    expect(await screen.findByText('What stands out', {}, { timeout: 6000 })).toBeInTheDocument();
    expect(screen.getByText('New requests per week')).toBeInTheDocument();

    await user.click(screen.getAllByRole('button', { name: /^Reports/ })[0]);
    expect(await screen.findByRole('heading', { level: 1, name: 'Reports' }, { timeout: 6000 })).toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: /Problem reports/ }));
    expect(screen.getByRole('heading', { level: 2, name: 'Problem reports' })).toBeInTheDocument();

    URL.createObjectURL = (() => 'blob:x') as typeof URL.createObjectURL;
    URL.revokeObjectURL = () => {};
    await user.click(screen.getByRole('button', { name: 'Download spreadsheet' }));
    expect(await screen.findByText('Report downloaded')).toBeInTheDocument();
  });

  it('starts the admin tour on the first sign-in', async () => {
    setPrefs({ tour: true });
    await signInAs('admin@ekapitan.local');
    expect(await screen.findByRole('heading', { name: 'Welcome to the admin portal' }, { timeout: 8000 })).toBeInTheDocument();
  });

  it('super admin also manages users and permissions', async () => {
    setPrefs({});
    const user = await signInAs('superadmin@ekapitan.local');
    const link = (await screen.findAllByRole('button', { name: /Users & permissions/ }, { timeout: 6000 }))[0];
    await user.click(link);
    expect(await screen.findByRole('heading', { level: 1, name: 'Users & permissions' }, { timeout: 6000 })).toBeInTheDocument();
    expect(screen.getAllByText('Super administrator').length).toBeGreaterThan(0);
  });
});

describe('guest mode', () => {
  const enterAsGuest = async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getAllByRole('button', { name: /Continue as guest/i })[0]);
    await pageTitle('Welcome');
    return user;
  };

  it('opens the resident-style app with guest places', async () => {
    setPrefs({});
    await enterAsGuest();
    expect(navButton(/^Track$/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Notifications/ })).not.toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Sign up' }).length).toBeGreaterThan(0);
  });

  it('asks guests to sign up for resident-only services', async () => {
    setPrefs({});
    const user = await enterAsGuest();
    await user.click(navButton(/^Services$/));
    await pageTitle('Services');
    await user.click(screen.getByRole('button', { name: /^Documents/ }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Sign up to request documents' }, { timeout: 6000 })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'I have an account' })).toBeInTheDocument();
  });

  it('tracks a request by its number', async () => {
    setPrefs({});
    const user = await enterAsGuest();
    await user.click(navButton(/^Track$/));
    await pageTitle('Track a request');
    await user.type(screen.getByLabelText(/Tracking number/), 'REQ-2026-0831');
    await user.click(screen.getByRole('button', { name: 'Check status' }));
    await waitFor(() => expect(screen.getByText('Certificate of Residency')).toBeInTheDocument(), { timeout: 6000 });
  });

  it('lets guests report a problem and track it', async () => {
    setPrefs({});
    const user = await enterAsGuest();
    await user.click(navButton(/^Report$/));
    await pageTitle('Report a problem');
    expect(screen.queryByRole('switch', { name: 'Hide my name' })).not.toBeInTheDocument();
    await user.type(screen.getByLabelText(/Street or landmark/), 'Near the chapel');
    await user.type(screen.getByLabelText(/What happened/), 'Loud karaoke every night past midnight.');
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: 'Send report' }));
    await user.click(await screen.findByRole('button', { name: 'Track this report' }));
    await pageTitle('Track a request');
    await waitFor(() => expect(screen.getByText('Problem report')).toBeInTheDocument(), { timeout: 6000 });
  });

  it('starts the guest tour on the first visit', async () => {
    setPrefs({ tour: true });
    await enterAsGuest();
    expect(await screen.findByText('You are looking around as a guest. Here is what you can do.', {}, { timeout: 6000 })).toBeInTheDocument();
  });

  it('shows the guest account page', async () => {
    setPrefs({});
    const user = await enterAsGuest();
    await user.click(navButton(/^Account$/));
    await pageTitle('Account');
    expect(screen.getByText('Browsing as a guest')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Display & language/ })).toBeInTheDocument();
  });
});

describe('resident portal', () => {
  it('signs in to Home', async () => {
    setPrefs({});
    await signIn();
    expect(await pageTitle('Maria')).toBeInTheDocument();
  });

  it('goes back to the page you came from, not the default', async () => {
    setPrefs({});
    const user = await signIn();
    await pageTitle('Maria');

    await user.click(navButton(/^Requests/));
    await pageTitle('Requests');

    await user.click(navButton(/^Notifications/));
    await pageTitle('Notifications');

    // Notifications belongs to Home, but it was opened from Requests: Back returns there.
    const back = navButton(/^Back to Requests/);
    await user.click(back);
    await pageTitle('Requests');
  });

  it('fixes and resends a request staff returned', async () => {
    setPrefs({});
    const user = await signIn();
    await pageTitle('Maria');
    await user.click(navButton(/^Requests/));
    await pageTitle('Requests');

    await user.click(await screen.findByRole('button', { name: /Certificate of Residency/ }));
    await user.click(await screen.findByRole('button', { name: /Fix and resend/ }));

    const sheet = await screen.findByRole('dialog', { name: 'Fix and resend' });
    const purpose = within(sheet).getByLabelText(/what is it for/i);
    await user.clear(purpose);
    await user.type(purpose, 'School enrollment, Grade 7');
    await user.click(within(sheet).getByRole('button', { name: 'Send again' }));

    expect(await screen.findByText('Sent again')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('button', { name: /Fix and resend/ })).not.toBeInTheDocument());
  });

  it('opens Settings from Account and applies text size and bold text', async () => {
    setPrefs({});
    const user = await signIn();
    await pageTitle('Maria');
    await user.click(navButton(/^Account$/));
    await pageTitle('Account');

    await user.click(screen.getByRole('button', { name: /Display & language/ }));
    await pageTitle('Display & language');

    await user.click(screen.getByRole('radio', { name: /Large/ }));
    expect(document.documentElement).toHaveClass('large-text');
    await user.click(screen.getByRole('radio', { name: /Small/ }));
    expect(document.documentElement).toHaveClass('small-text');
    expect(document.documentElement).not.toHaveClass('large-text');

    await user.click(screen.getByRole('switch', { name: 'Bold text' }));
    expect(document.documentElement).toHaveClass('bold-text');
  });

  it('has separate Notification settings and the legal pages under Account', async () => {
    setPrefs({});
    const user = await signIn();
    await pageTitle('Maria');
    await user.click(navButton(/^Account$/));
    await pageTitle('Account');

    await user.click(within(screen.getByRole('main')).getByRole('button', { name: /^Notifications/ }));
    await pageTitle('Notifications');
    expect(screen.getByRole('switch', { name: 'Reminders' })).toBeInTheDocument();
    expect(screen.queryByRole('radio', { name: /Large/ })).not.toBeInTheDocument();

    await user.click(navButton(/^Back to Account/));
    await pageTitle('Account');
    await user.click(screen.getByRole('button', { name: /^Privacy Policy/ }));
    await pageTitle('Privacy Policy');

    // No links to the other documents; a way back up instead.
    expect(screen.queryByRole('navigation', { name: 'Other legal documents' })).not.toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Back to top' })).toHaveLength(1);
    // Scrolled down: the floating button appears too.
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 900 });
    window.dispatchEvent(new Event('scroll'));
    await waitFor(() => expect(screen.getAllByRole('button', { name: 'Back to top' })).toHaveLength(2));
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 });
    expect(screen.getByRole('heading', { name: /Your rights/ })).toBeInTheDocument();
  });

  it('finds services despite typos', async () => {
    setPrefs({});
    const user = await signIn();
    await pageTitle('Maria');
    await user.click(navButton(/^Services/));
    await pageTitle('Services');
    await user.type(screen.getByRole('searchbox', { name: 'Search services' }), 'clerance');
    // Results appear once typing pauses (debounced).
    expect(await screen.findByText('1 result')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Documents/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Book the court/ })).not.toBeInTheDocument();
  });

  it('shows the app in Filipino when chosen', async () => {
    setPrefs({ language: 'fil' });
    await signIn();
    await pageTitle('Maria');
    expect(navButton(/^Mga request/)).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Mga serbisyo' }).length).toBeGreaterThan(0);
  });

  it('starts the guided tour on first sign-in', async () => {
    setPrefs({ tour: true });
    await signIn();
    expect(await screen.findByRole('heading', { name: 'Welcome to eKapitan' }, { timeout: 6000 })).toBeInTheDocument();
  });
});
