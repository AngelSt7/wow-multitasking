import { Button, DateField, DateRangePicker, Label, RangeCalendar, type DateValue, type RangeValue } from "@heroui/react";
import { CreateException } from "../../services/CreateException.service";
import { useState } from "react";
import Swal from "sweetalert2";

const getInstaladorId = (): number => {
  const match = window.location.pathname.match(/\/configuracion-instaladores\/(\d+)/);
  return match ? Number(match[1]) : 0;
};

export default function Prueba() {

    const [selectedDates, setSelectedDates] = useState<string[] | null>(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(false);

    const onChange = (value: RangeValue<DateValue> | null) => {
        if (!value?.start || !value?.end) return;
        setSuccess(false);
        setError(false);

        const dates: string[] = [];
        let current = value.start;

        while (current.compare(value.end) <= 0) {
            const mm = String(current.month).padStart(2, '0');
            const dd = String(current.day).padStart(2, '0');
            dates.push(`${current.year}-${mm}-${dd}`);
            current = current.add({ days: 1 });
        }
        setSelectedDates(dates);
    }

    const onSubmit = async () => {
        if (!selectedDates && !error) return;

        const instaladorId = getInstaladorId();
        const cantidadDias = selectedDates!.length;

        setLoading(true);
        setError(false);

        try {
            await CreateException.create(selectedDates!, instaladorId);
            setSuccess(true);
            setSelectedDates(null);

            const result = await Swal.fire({
                icon: 'success',
                title: '¡Excepciones guardadas!',
                html: `Se registraron <b>${cantidadDias}</b> día${cantidadDias !== 1 ? 's' : ''} correctamente.`,
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#22c55e',
                allowOutsideClick: false, // ← no se cierra clickando afuera
                allowEscapeKey: false,    // ← no se cierra con ESC
                showClass: {
                    popup: 'animate__animated animate__bounceIn'
                },
                hideClass: {
                    popup: 'animate__animated animate__bounceOut'
                }
            });

            if (result.isConfirmed) {
                window.location.reload(); // ← recarga al dar Aceptar
            }

        } catch (e) {
            console.error(e);
            setError(true);

            await Swal.fire({
                icon: 'error',
                title: 'Error al guardar',
                text: 'No se pudieron guardar las excepciones. Intentá de nuevo.',
                confirmButtonText: 'Reintentar',
                confirmButtonColor: '#ef4444',
                showClass: {
                    popup: 'animate__animated animate__shakeX'
                },
                hideClass: {
                    popup: 'animate__animated animate__fadeOutDown'
                }
            });
        } finally {
            setLoading(false);
        }
    }

    const btnStyle = (): React.CSSProperties => {
        if (error) return {
            background: 'linear-gradient(135deg, #ef4444, #dc2626)',
            color: '#fff',
            border: 'none',
            boxShadow: '0 4px 14px rgba(239,68,68,0.4)',
        };
        if (success) return {
            background: 'linear-gradient(135deg, #22c55e, #16a34a)',
            color: '#fff',
            border: 'none',
            boxShadow: '0 4px 14px rgba(34,197,94,0.4)',
        };
        if (selectedDates) return {
            background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
            color: '#fff',
            border: 'none',
            boxShadow: '0 4px 14px rgba(59,130,246,0.4)',
        };
        return {
            background: 'transparent',
            color: '#94a3b8',
            border: '1px solid #cbd5e1',
            boxShadow: 'none',
        };
    };

    return (
        <div style={{
            display: 'inline-flex',
            alignItems: 'flex-end',
            gap: '12px',
            marginLeft: '12px',
            marginTop: '12px',
            padding: '12px 16px',
            background: 'rgba(255,255,255,0.6)',
            backdropFilter: 'blur(8px)',
            borderRadius: '12px',
            border: '1px solid rgba(203,213,225,0.5)',
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        }}>
            <DateRangePicker
                onChange={(e) => onChange(e)}
                className="w-72"
                endName="endDate"
                startName="startDate"
            >
                <Label>Selecciona un rango de fechas</Label>
                <DateField.Group fullWidth>
                    <DateField.Input slot="start">
                        {(segment) => <DateField.Segment segment={segment} />}
                    </DateField.Input>
                    <DateRangePicker.RangeSeparator />
                    <DateField.Input slot="end">
                        {(segment) => <DateField.Segment segment={segment} />}
                    </DateField.Input>
                    <DateField.Suffix>
                        <DateRangePicker.Trigger>
                            <DateRangePicker.TriggerIndicator />
                        </DateRangePicker.Trigger>
                    </DateField.Suffix>
                </DateField.Group>
                <DateRangePicker.Popover>
                    <RangeCalendar aria-label="Trip dates">
                        <RangeCalendar.Header>
                            <RangeCalendar.YearPickerTrigger>
                                <RangeCalendar.YearPickerTriggerHeading />
                                <RangeCalendar.YearPickerTriggerIndicator />
                            </RangeCalendar.YearPickerTrigger>
                            <RangeCalendar.NavButton slot="previous" />
                            <RangeCalendar.NavButton slot="next" />
                        </RangeCalendar.Header>
                        <RangeCalendar.Grid>
                            <RangeCalendar.GridHeader>
                                {(day) => <RangeCalendar.HeaderCell>{day}</RangeCalendar.HeaderCell>}
                            </RangeCalendar.GridHeader>
                            <RangeCalendar.GridBody>
                                {(date) => <RangeCalendar.Cell date={date} />}
                            </RangeCalendar.GridBody>
                        </RangeCalendar.Grid>
                        <RangeCalendar.YearPickerGrid>
                            <RangeCalendar.YearPickerGridBody>
                                {({ year }) => <RangeCalendar.YearPickerCell year={year} />}
                            </RangeCalendar.YearPickerGridBody>
                        </RangeCalendar.YearPickerGrid>
                    </RangeCalendar>
                </DateRangePicker.Popover>
            </DateRangePicker>

            <Button
                variant={error ? 'danger' : success ? 'secondary' : selectedDates ? 'primary' : 'outline'}
                isPending={loading}
                isDisabled={!selectedDates && !success && !error}
                size="sm"
                onPress={onSubmit}
                style={{
                    ...btnStyle(),
                    borderRadius: '8px',
                    padding: '6px 16px',
                    fontSize: '13px',
                    fontWeight: '600',
                    letterSpacing: '0.01em',
                    cursor: selectedDates || error ? 'pointer' : 'not-allowed',
                    opacity: !selectedDates && !success && !error ? 0.5 : 1,
                    transition: 'all 0.25s ease',
                    whiteSpace: 'nowrap',
                }}
            >
                {success
                    ? '✓ Guardado'
                    : error
                        ? '✗ Reintentar'
                        : selectedDates
                            ? `Guardar ${selectedDates.length} día${selectedDates.length !== 1 ? 's' : ''}`
                            : 'Guardar excepciones'
                }
            </Button>
        </div>
    )
}