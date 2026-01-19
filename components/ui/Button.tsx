export default function Button({
  variant = 'primary',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'outline' | 'ghost' }) {
  const cls =
    variant === 'outline' ? 'btn btn-outline' :
    variant === 'ghost' ? 'btn btn-ghost' :
    'btn btn-primary';

  return <button {...props} className={`${cls} ${props.className || ''}`} />;
}
