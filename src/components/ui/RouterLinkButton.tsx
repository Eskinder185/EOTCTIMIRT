import type { ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router-dom'
import { buttonClass, type ButtonVariant } from './buttonStyles'

/** Same look as `Button`, but renders an anchor for valid mobile tap targets in navigation. */
export function RouterLinkButton({
  variant = 'primary',
  className = '',
  children,
  ...props
}: LinkProps & { variant?: ButtonVariant; children: ReactNode }) {
  return (
    <Link className={buttonClass(variant, className)} {...props}>
      {children}
    </Link>
  )
}
