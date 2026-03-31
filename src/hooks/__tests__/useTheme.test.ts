import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTheme } from '../useTheme'

describe('useTheme', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove('dark')
  })

  it('defaults to light when no stored preference and system is light', () => {
    const { result } = renderHook(() => useTheme())
    expect(result.current.theme).toBe('light')
  })

  it('reads stored theme from localStorage', () => {
    localStorage.setItem('theme', 'dark')
    const { result } = renderHook(() => useTheme())
    expect(result.current.theme).toBe('dark')
  })

  it('toggles from light to dark', () => {
    const { result } = renderHook(() => useTheme())
    act(() => result.current.toggle())
    expect(result.current.theme).toBe('dark')
  })

  it('toggles from dark to light', () => {
    localStorage.setItem('theme', 'dark')
    const { result } = renderHook(() => useTheme())
    act(() => result.current.toggle())
    expect(result.current.theme).toBe('light')
  })

  it('persists theme to localStorage on toggle', () => {
    const { result } = renderHook(() => useTheme())
    act(() => result.current.toggle())
    expect(localStorage.getItem('theme')).toBe('dark')
  })

  it('applies dark class to document element', () => {
    localStorage.setItem('theme', 'dark')
    renderHook(() => useTheme())
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('removes dark class when light', () => {
    document.documentElement.classList.add('dark')
    localStorage.setItem('theme', 'light')
    renderHook(() => useTheme())
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })
})
