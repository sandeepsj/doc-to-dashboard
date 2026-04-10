import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ShareProjectModal } from '../ShareProjectModal'

const mockShare = vi.fn()
const mockRevoke = vi.fn()
const mockLoadPermissions = vi.fn()
const mockClearError = vi.fn()

let hookState = {
  permissions: [] as { id: string; type: string; role: string; emailAddress?: string; displayName?: string }[],
  loading: false,
  sharing: false,
  error: null as string | null,
}

vi.mock('../../hooks/useShareProject', () => ({
  useShareProject: () => ({
    ...hookState,
    share: mockShare,
    revoke: mockRevoke,
    loadPermissions: mockLoadPermissions,
    clearError: mockClearError,
  }),
}))

const defaultProps = {
  projectName: 'My Project',
  folderId: 'folder-123',
  accessToken: 'token-abc',
  onClose: vi.fn(),
}

beforeEach(() => {
  mockShare.mockReset()
  mockRevoke.mockReset()
  mockLoadPermissions.mockReset()
  mockClearError.mockReset()
  defaultProps.onClose.mockReset()
  hookState = {
    permissions: [],
    loading: false,
    sharing: false,
    error: null,
  }
})

describe('ShareProjectModal', () => {
  it('renders with project name in title', () => {
    render(<ShareProjectModal {...defaultProps} />)
    expect(screen.getByText('Share "My Project"')).toBeInTheDocument()
  })

  it('renders email input and role selector', () => {
    render(<ShareProjectModal {...defaultProps} />)
    expect(screen.getByPlaceholderText('Email address')).toBeInTheDocument()
    expect(screen.getByLabelText('Permission role')).toBeInTheDocument()
  })

  it('has a share button that is disabled when email is empty', () => {
    render(<ShareProjectModal {...defaultProps} />)
    const shareBtn = screen.getByRole('button', { name: 'Share' })
    expect(shareBtn).toBeDisabled()
  })

  it('enables share button when email is entered', () => {
    render(<ShareProjectModal {...defaultProps} />)
    fireEvent.change(screen.getByPlaceholderText('Email address'), { target: { value: 'test@example.com' } })
    const shareBtn = screen.getByRole('button', { name: 'Share' })
    expect(shareBtn).not.toBeDisabled()
  })

  it('calls share with email and role on submit', async () => {
    mockShare.mockResolvedValueOnce(undefined)
    render(<ShareProjectModal {...defaultProps} />)

    fireEvent.change(screen.getByPlaceholderText('Email address'), { target: { value: 'bob@test.com' } })
    // Select "Editor" role
    fireEvent.change(screen.getByLabelText('Permission role'), { target: { value: 'writer' } })
    fireEvent.click(screen.getByRole('button', { name: 'Share' }))

    await waitFor(() => {
      expect(mockShare).toHaveBeenCalledWith('bob@test.com', 'writer', true)
    })
  })

  it('calls share on Enter key in email input', async () => {
    mockShare.mockResolvedValueOnce(undefined)
    render(<ShareProjectModal {...defaultProps} />)

    const input = screen.getByPlaceholderText('Email address')
    fireEvent.change(input, { target: { value: 'enter@test.com' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    await waitFor(() => {
      expect(mockShare).toHaveBeenCalledWith('enter@test.com', 'reader', true)
    })
  })

  it('clears email after successful share', async () => {
    mockShare.mockResolvedValueOnce(undefined)
    render(<ShareProjectModal {...defaultProps} />)

    const input = screen.getByPlaceholderText('Email address')
    fireEvent.change(input, { target: { value: 'clear@test.com' } })
    fireEvent.click(screen.getByRole('button', { name: 'Share' }))

    await waitFor(() => {
      expect((input as HTMLInputElement).value).toBe('')
    })
  })

  it('shows success message after share', async () => {
    mockShare.mockResolvedValueOnce(undefined)
    render(<ShareProjectModal {...defaultProps} />)

    fireEvent.change(screen.getByPlaceholderText('Email address'), { target: { value: 'ok@test.com' } })
    fireEvent.click(screen.getByRole('button', { name: 'Share' }))

    await waitFor(() => {
      expect(screen.getByText('Shared with ok@test.com as Viewer')).toBeInTheDocument()
    })
  })

  it('passes notify=false when checkbox is unchecked', async () => {
    mockShare.mockResolvedValueOnce(undefined)
    render(<ShareProjectModal {...defaultProps} />)

    fireEvent.change(screen.getByPlaceholderText('Email address'), { target: { value: 'no-notify@test.com' } })
    fireEvent.click(screen.getByRole('checkbox'))
    fireEvent.click(screen.getByRole('button', { name: 'Share' }))

    await waitFor(() => {
      expect(mockShare).toHaveBeenCalledWith('no-notify@test.com', 'reader', false)
    })
  })

  it('displays error message', () => {
    hookState.error = 'Something went wrong'
    render(<ShareProjectModal {...defaultProps} />)
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })

  it('shows "Sharing..." text when sharing is in progress', () => {
    hookState.sharing = true
    render(<ShareProjectModal {...defaultProps} />)
    expect(screen.getByText('Sharing...')).toBeInTheDocument()
  })

  it('shows loading spinner when loading permissions', () => {
    hookState.loading = true
    render(<ShareProjectModal {...defaultProps} />)
    // Should not show "Not shared with anyone yet." while loading
    expect(screen.queryByText('Not shared with anyone yet.')).not.toBeInTheDocument()
  })

  it('shows empty state when no shared permissions', () => {
    render(<ShareProjectModal {...defaultProps} />)
    expect(screen.getByText('Not shared with anyone yet.')).toBeInTheDocument()
  })

  it('renders shared user permissions (excludes owner)', () => {
    hookState.permissions = [
      { id: 'p-owner', type: 'user', role: 'owner', emailAddress: 'owner@test.com' },
      { id: 'p-reader', type: 'user', role: 'reader', emailAddress: 'bob@test.com', displayName: 'Bob' },
    ]
    render(<ShareProjectModal {...defaultProps} />)

    // Owner should not be listed
    expect(screen.queryByText('owner@test.com')).not.toBeInTheDocument()
    // Reader should be listed
    expect(screen.getByText('Bob')).toBeInTheDocument()
    expect(screen.getByText('bob@test.com')).toBeInTheDocument()
    // "Viewer" appears in both the role <option> and the permission list
    const viewerElements = screen.getAllByText('Viewer')
    expect(viewerElements.length).toBeGreaterThanOrEqual(2)
  })

  it('calls revoke when remove button is clicked', async () => {
    hookState.permissions = [
      { id: 'p-reader', type: 'user', role: 'reader', emailAddress: 'bob@test.com' },
    ]
    mockRevoke.mockResolvedValueOnce(undefined)
    render(<ShareProjectModal {...defaultProps} />)

    fireEvent.click(screen.getByLabelText('Remove bob@test.com'))

    await waitFor(() => {
      expect(mockRevoke).toHaveBeenCalledWith('p-reader')
    })
  })

  it('calls onClose when close button is clicked', () => {
    render(<ShareProjectModal {...defaultProps} />)
    fireEvent.click(screen.getByLabelText('Close'))
    expect(defaultProps.onClose).toHaveBeenCalled()
  })

  it('calls onClose on Escape key', () => {
    render(<ShareProjectModal {...defaultProps} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(defaultProps.onClose).toHaveBeenCalled()
  })

  it('calls onClose when clicking backdrop', () => {
    render(<ShareProjectModal {...defaultProps} />)
    const backdrop = screen.getByRole('dialog')
    fireEvent.click(backdrop)
    expect(defaultProps.onClose).toHaveBeenCalled()
  })

  it('renders all role options in selector', () => {
    render(<ShareProjectModal {...defaultProps} />)
    const select = screen.getByLabelText('Permission role')
    const options = select.querySelectorAll('option')
    expect(options).toHaveLength(3)
    expect(options[0].textContent).toBe('Viewer')
    expect(options[1].textContent).toBe('Commenter')
    expect(options[2].textContent).toBe('Editor')
  })
})
