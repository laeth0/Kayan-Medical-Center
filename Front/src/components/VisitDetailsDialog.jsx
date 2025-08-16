

import { Fragment, useEffect, useState } from "react";
import dayjs from "dayjs";
import {
    Box, Stack, Typography, Chip, Button, Divider, Dialog, DialogTitle,
    DialogContent, DialogActions
} from "@mui/material";
import api from "../lib/apiClient";
import { toast } from "react-toastify";


export default function VisitDetailsDialog({ open, onClose, id }) {
    const [loading, setLoading] = useState(false);
    const [visit, setVisit] = useState(null);

    useEffect(() => {
        if (!open || !id) return;
        (async () => {
            try {
                setLoading(true);
                const { data } = await api.get(`/visit/patient/${id}`);
                setVisit(data);
            } catch (e) {
                toast.error(e?.response?.data?.message || "Failed to load visit");
            } finally {
                setLoading(false);
            }
        })();
    }, [open, id]);

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>Visit details</DialogTitle>
            <DialogContent dividers>
                {!visit ? (
                    <Typography variant="body2" color="text.secondary">
                        {loading ? "Loading..." : "No data"}
                    </Typography>
                ) : (
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <Stack direction="row" spacing={2} alignItems="center">
                            <Chip label={visit.status} size="small" />
                            <Typography variant="body2" color="text.secondary">
                                {dayjs(visit.end_time || visit.start_time).format("MMM D, YYYY — HH:mm")}
                            </Typography>
                            {visit.doctor?.name && <Typography>• Dr. {visit.doctor.name} ({visit.doctor.specialty || "—"})</Typography>}
                        </Stack>

                        {visit.appointment && (
                            <Typography variant="body2" color="text.secondary">
                                Type: {visit.appointment.type || "—"} • Reason: {visit.appointment.reason || "—"}
                            </Typography>
                        )}

                        <Divider />

                        <Stack>
                            <Typography variant="subtitle2" sx={{ mb: 0.5 }}>Doctor notes / Diagnosis</Typography>
                            <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                                {visit.clinical_notes || "—"}
                            </Typography>
                        </Stack>

                        <Stack>
                            <Typography variant="subtitle2" sx={{ mb: 0.5 }}>Treatments / Prescription</Typography>
                            {(!visit.treatments || visit.treatments.length === 0) ? (
                                <Typography variant="body2" color="text.secondary">No treatments.</Typography>
                            ) : (
                                <Box sx={{ display: "grid", gridTemplateColumns: "1fr auto auto auto", gap: 1 }}>
                                    <Typography sx={{ fontWeight: 700 }}>Name</Typography>
                                    <Typography sx={{ fontWeight: 700, textAlign: "right" }}>Qty</Typography>
                                    <Typography sx={{ fontWeight: 700, textAlign: "right" }}>Unit</Typography>
                                    <Typography sx={{ fontWeight: 700, textAlign: "right" }}>Total</Typography>
                                    {visit.treatments.map((t, i) => (
                                        <Fragment key={i}>
                                            <Typography>{t.name}</Typography>
                                            <Typography sx={{ textAlign: "right" }}>{t.quantity}</Typography>
                                            <Typography sx={{ textAlign: "right" }}>${Number(t.unit_price).toFixed(2)}</Typography>
                                            <Typography sx={{ textAlign: "right" }}>${Number(t.total_price ?? (t.quantity * t.unit_price)).toFixed(2)}</Typography>
                                        </Fragment>
                                    ))}
                                </Box>
                            )}
                        </Stack>

                        {visit.invoice && (
                            <>
                                <Divider />
                                <Stack direction="row" justifyContent="flex-end">
                                    <Chip label={`Total: $${Number(visit.invoice.total_amount).toFixed(2)}`} color="primary" variant="outlined" />
                                </Stack>
                            </>
                        )}
                    </Stack>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Close</Button>
            </DialogActions>
        </Dialog>
    );
}