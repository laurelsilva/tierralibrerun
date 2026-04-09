'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useCallback } from 'react'

interface ModalProps {
  children: React.ReactNode
}

export default function Modal({ children }: ModalProps) {
  const router = useRouter()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const previousActiveElement = useRef<HTMLElement | null>(null)

  const closeModal = useCallback(() => {
    router.back()
  }, [router])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    previousActiveElement.current = document.activeElement as HTMLElement
    dialog.showModal()
    dialog.focus()
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        closeModal()
      }
    }

    const handleFocusTrap = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      const focusableElements = dialog.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      const firstElement = focusableElements[0] as HTMLElement
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault()
        lastElement?.focus()
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault()
        firstElement?.focus()
      }
    }

    dialog.addEventListener('keydown', handleKeyDown)
    dialog.addEventListener('keydown', handleFocusTrap)

    return () => {
      dialog.removeEventListener('keydown', handleKeyDown)
      dialog.removeEventListener('keydown', handleFocusTrap)
      document.body.style.overflow = 'unset'
      
      if (previousActiveElement.current) {
        previousActiveElement.current.focus({ preventScroll: true })
      }
    }
  }, [closeModal])

  const handleBackdropClick = () => {
    closeModal()
  }

  const handleContentClick = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  return (
    <dialog
      ref={dialogRef}
      className="fixed inset-0 z-50 w-screen h-screen max-w-none max-h-none m-0 p-0 backdrop:bg-transparent overflow-hidden"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        className="fixed inset-0"
        onClick={handleBackdropClick}
        style={{
          background: 'rgba(255, 193, 7, 0.15)',
          backdropFilter: 'blur(20px) saturate(180%) brightness(110%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%) brightness(110%)',
        }}
      />

      <div className="flex min-h-full items-center justify-center p-4" onClick={handleBackdropClick}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-background rounded-lg shadow-xl border border-border"
          onClick={handleContentClick}
          role="document"
        >
          <button
            onClick={closeModal}
            className="absolute right-4 top-4 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full bg-background/80 hover:bg-background transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            aria-label="Close modal"
            type="button"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
          {children}
        </motion.div>
      </div>
    </dialog>
  )
}