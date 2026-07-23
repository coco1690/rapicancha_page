import type { ButtonHTMLAttributes, InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { Add, DeleteOutlined, EditOutlined, Logout, SaveOutlined, Search } from '@mui/icons-material'
import { Autocomplete, Button, Checkbox, FormControl, NativeSelect, TextField } from '@mui/material'

const structuralClassName = (value: string) => value.split(/\s+/).filter((name) => name && !['field', 'primary-button', 'secondary-button'].includes(name) && !name.startsWith('text-red-') && !name.startsWith('bg-zinc-')).join(' ')

export function AppButton({ className = '', children, type = 'submit', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  const variant = className.includes('primary-button') ? 'contained' : className.includes('secondary-button') ? 'outlined' : 'text'
  const color = className.includes('text-red') ? 'error' : 'primary'
  const label = typeof children === 'string' ? children.toLocaleLowerCase('es') : ''
  const startIcon = label.includes('nuevo') || label.includes('crear') ? <Add /> : label.includes('editar') || label.includes('atender') ? <EditOutlined /> : label.includes('eliminar') ? <DeleteOutlined /> : label.includes('guardar') ? <SaveOutlined /> : label.includes('buscar') ? <Search /> : label.includes('cerrar sesion') || label === 'salir' ? <Logout /> : undefined
  return <Button {...props} className={structuralClassName(className)} color={color} startIcon={startIcon} type={type} variant={variant}>{children}</Button>
}

export function AppInput({ className = '', type, checked, onChange, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  if (type === 'checkbox') return <Checkbox checked={checked} disabled={props.disabled} name={props.name} onChange={onChange} slotProps={{ input: { 'aria-label': props['aria-label'] ?? props.name ?? 'Seleccionar' } }} />
  return <TextField className={structuralClassName(className)} id={props.id} name={props.name} value={props.value} defaultValue={props.defaultValue} required={props.required} disabled={props.disabled} placeholder={props.placeholder} autoComplete={props.autoComplete} autoFocus={props.autoFocus} onBlur={props.onBlur} onFocus={props.onFocus} type={type} onChange={onChange} slotProps={{ htmlInput: { min: props.min, max: props.max, step: props.step, minLength: props.minLength, maxLength: props.maxLength, readOnly: props.readOnly, 'aria-label': props['aria-label'] } }} />
}

export function AppSelect({ className = '', children, onChange, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <FormControl className={structuralClassName(className)} disabled={props.disabled} required={props.required}><NativeSelect name={props.name} value={props.value} defaultValue={props.defaultValue} onChange={onChange}>{children}</NativeSelect></FormControl>
}

export function AppTextArea({ className = '', rows, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <TextField className={structuralClassName(className)} name={props.name} value={props.value} defaultValue={props.defaultValue} required={props.required} disabled={props.disabled} placeholder={props.placeholder} onChange={props.onChange} onBlur={props.onBlur} multiline minRows={rows ?? 3} slotProps={{ htmlInput: { minLength: props.minLength, maxLength: props.maxLength, readOnly: props.readOnly, 'aria-label': props['aria-label'] } }} />
}

export type AppAutocompleteOption = { value: string; label: string }

export function AppAutocomplete({ label, value, options, required, disabled, onChange }: { label: string; value: string; options: AppAutocompleteOption[]; required?: boolean; disabled?: boolean; onChange: (value: string) => void }) {
  const selected = options.find((option) => option.value === value) ?? null
  return <Autocomplete disabled={disabled} getOptionLabel={(option) => option.label} isOptionEqualToValue={(option, current) => option.value === current.value} onChange={(_, option) => onChange(option?.value ?? '')} options={options} value={selected} renderInput={(params) => <TextField {...params} label={label} required={required} />} />
}
