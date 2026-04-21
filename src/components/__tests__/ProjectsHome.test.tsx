import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { ProjectsHome } from '../ProjectsHome'
import type { ProjectInfo } from '../../backends/storageProvider'

// --- Mocks ---------------------------------------------------------------

const mockListProjects = vi.fn<[], Promise<ProjectInfo[]>>()
let authState = {
  isLoggedIn: true,
  accessToken: 'token-abc' as string | null,
  user: { email: 'me@example.com', name: 'Me', picture: '' },
}

vi.mock('../../contexts/AuthContext', () => ({
  useAuthContext: () => ({
    auth: authState,
    authAvailable: true,
    signIn: vi.fn(),
    signOut: vi.fn(),
    storage: { listProjects: mockListProjects },
  }),
}))

vi.mock('../../services/driveApi', () => ({
  listSharedFolders: vi.fn().mockResolvedValue([]),
  listFilesInFolder: vi.fn().mockResolvedValue([]),
}))

vi.mock('../GoogleSignIn', () => ({
  GoogleSignIn: () => <div data-testid="google-signin" />,
}))

vi.mock('../ShareProjectModal', () => ({
  ShareProjectModal: ({ projectName, onClose }: { projectName: string; onClose: () => void }) => (
    <div role="dialog" aria-label="share-modal">
      <span>share:{projectName}</span>
      <button onClick={onClose}>close</button>
    </div>
  ),
}))

vi.mock('../ThemeToggle', () => ({
  ThemeToggle: () => <div data-testid="theme-toggle" />,
}))

// react-dropzone uses window.URL.createObjectURL etc; stub out the hook
vi.mock('react-dropzone', () => ({
  useDropzone: () => ({
    getRootProps: () => ({}),
    getInputProps: () => ({}),
    isDragActive: false,
  }),
}))

// Stub manifest fetch (for local projects section)
const originalFetch = global.fetch
beforeEach(() => {
  mockListProjects.mockReset()
  authState = {
    isLoggedIn: true,
    accessToken: 'token-abc',
    user: { email: 'me@example.com', name: 'Me', picture: '' },
  }
  global.fetch = vi.fn().mockResolvedValue({
    json: async () => ({ projects: [] }),
  }) as unknown as typeof fetch
})

afterAll(() => {
  global.fetch = originalFetch
})

// --- Helpers -------------------------------------------------------------

const driveProject: ProjectInfo = {
  id: 'folder-1',
  name: 'Alpha Research',
  files: ['one.md', 'two.md'],
}

const defaultProps = {
  onOpenProject: vi.fn(),
  onFiles: vi.fn(),
  onDriveUpload: vi.fn(),
  theme: 'dark' as const,
  onToggleTheme: vi.fn(),
  loading: false,
}

async function renderWithProjects(projects: ProjectInfo[] = [driveProject]) {
  mockListProjects.mockResolvedValue(projects)
  render(<ProjectsHome {...defaultProps} />)
  // Wait for the drive project card to appear
  if (projects.length > 0) {
    await screen.findByText(projects[0].name)
  }
}

// --- Tests ---------------------------------------------------------------

describe('ProjectsHome drive card — overflow menu & Drive chip', () => {
  it('renders the inline Drive chip alongside the file-count pill', async () => {
    await renderWithProjects()

    // Drive chip has a "Stored in Google Drive" title
    expect(screen.getByTitle('Stored in Google Drive')).toBeInTheDocument()

    // File-count pill still renders
    expect(screen.getByText('2 files')).toBeInTheDocument()
  })

  it('does not render the old standalone share button or inline Drive link', async () => {
    await renderWithProjects()

    // Old pattern: a separate "Share Alpha Research" button was rendered at top-right.
    // Under the new pattern, the share action lives inside the overflow menu and is
    // only reachable after the menu is opened.
    expect(screen.queryByLabelText('Share Alpha Research')).not.toBeInTheDocument()
  })

  it('does not show the overflow menu until the trigger is clicked', async () => {
    await renderWithProjects()

    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    // But the trigger exists
    expect(screen.getByLabelText('More actions for Alpha Research')).toBeInTheDocument()
  })

  it('opens the overflow menu with Share and Open in Drive items on click', async () => {
    await renderWithProjects()

    fireEvent.click(screen.getByLabelText('More actions for Alpha Research'))

    const menu = await screen.findByRole('menu')
    expect(within(menu).getByText('Share')).toBeInTheDocument()
    const openInDrive = within(menu).getByText('Open in Drive')
    expect(openInDrive).toBeInTheDocument()
    // The "Open in Drive" item is an anchor pointing to the folder URL
    expect(openInDrive.closest('a')).toHaveAttribute(
      'href',
      'https://drive.google.com/drive/folders/folder-1'
    )
    expect(openInDrive.closest('a')).toHaveAttribute('target', '_blank')
  })

  it('clicking Share opens the share modal and closes the menu', async () => {
    await renderWithProjects()

    fireEvent.click(screen.getByLabelText('More actions for Alpha Research'))
    fireEvent.click(within(await screen.findByRole('menu')).getByText('Share'))

    // Menu closes
    await waitFor(() => {
      expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    })
    // Share modal renders (via our stub)
    expect(screen.getByText('share:Alpha Research')).toBeInTheDocument()
  })

  it('clicking Open in Drive closes the menu', async () => {
    await renderWithProjects()

    fireEvent.click(screen.getByLabelText('More actions for Alpha Research'))
    const menu = await screen.findByRole('menu')
    fireEvent.click(within(menu).getByText('Open in Drive'))

    await waitFor(() => {
      expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    })
  })

  it('closes the menu on outside click', async () => {
    await renderWithProjects()

    fireEvent.click(screen.getByLabelText('More actions for Alpha Research'))
    await screen.findByRole('menu')

    // Click somewhere outside the menu
    fireEvent.click(document.body)

    await waitFor(() => {
      expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    })
  })

  it('clicking the trigger does not fire the underlying "open project" button', async () => {
    await renderWithProjects()

    fireEvent.click(screen.getByLabelText('More actions for Alpha Research'))

    expect(defaultProps.onOpenProject).not.toHaveBeenCalled()
  })

  it('trigger toggles aria-expanded', async () => {
    await renderWithProjects()

    const trigger = screen.getByLabelText('More actions for Alpha Research')
    expect(trigger).toHaveAttribute('aria-expanded', 'false')

    fireEvent.click(trigger)
    await screen.findByRole('menu')
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
  })
})
