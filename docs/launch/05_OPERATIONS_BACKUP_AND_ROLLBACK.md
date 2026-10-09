# Mana Calendar 2027 — Operations, Backup & Emergency Rollback Runbook

**Document Type:** Production Operations Runbook  
**Target System:** `https://manacalendar.in` & Android `in.manacalendar.app`  
**Escalation Lead:** Platform Owner (`owner@manacalendar2027.com`)  

---

## 1. Automated Backup & Disaster Recovery Runbook

### Backup Topology & Frequency:
* **Continuous Point-in-Time Recovery (PITR):** PostgreSQL Write-Ahead Logs (WAL) streamed continuously (7-day retention).
* **Automated Daily Logical Snapshots:** Daily snapshot taken at 02:00 AM IST via `BackupService` with SHA-256 cryptographic checksums.
* **Storage Location:** Multi-region, immutable Cloud Storage with Object Versioning enabled.

### Disaster Recovery Restoration Protocol:
1. **Verification Test:**
   * Run automated restoration verification via `BackupService.verifyAndRestoreSnapshot(snapshot)`.
   * Compare computed SHA-256 checksum with stored snapshot manifest.
2. **Emergency Database Restoration (Recovery Time Objective < 30 mins):**
   ```bash
   # In emergency restoration:
   supabase db restore --project-ref <prod_ref> --backup-id <snapshot_id>
   ```
3. **Post-Restore Validation:**
   * Verify all 31 core tables exist.
   * Verify record counts for `businesses`, `campaigns`, `subscriptions`, and `panchangam`.
   * Log `database_restore_verified` in `public.audit_logs`.

---

## 2. Production Health Monitoring & Alerting

### Key Health Metrics:
| Metric | Healthy Threshold | Critical Alert Level | Action Required |
|---|---|---|---|
| Play Store Android Crash Rate | < 0.1% | > 0.5% | Immediately pause staged rollout |
| Play Store ANR Rate | 0.0% | > 0.2% | Inspect main-thread blocking |
| Edge Function Error Rate | < 0.5% | > 2.0% | Inspect upstream API providers |
| Razorpay Payment Webhook Failures | 0 | > 1 | Check HMAC signature and webhook endpoint |
| Database CPU / IOPS Utilization | < 40% | > 80% | Scale Supabase compute instance |

---

## 3. Safe User-Facing Error Messages

The platform enforces strict error masking. Users and merchants **never** see raw database errors, SQL syntax, or internal IDs:

* **Database Connection Failure:** *"Something went wrong. Please check your connection and try again."*
* **Weather Provider Failure:** *"Weather information is temporarily unavailable for this location."*
* **Panchangam Engine Degraded:** *"Calculating auspicious timings... using local almanac cache."*
* **Payment Failure:** *"Your payment was not completed. No money was deducted. Please try again or use another payment method."*
* **Invalid QR Code:** *"Unable to find this partner store. Please scan a valid Mana Calendar partner QR code."*

---

## 4. Emergency Rollback Procedure

If a critical blocker is discovered post-release (e.g. fatal crash on specific Android version, payment gateway failure, or severe data issue):

```
+-----------------------------------------------------------------------------+
|                         EMERGENCY ROLLBACK DECISION TREE                    |
+-----------------------------------------------------------------------------+
                                      |
                     Is the issue client-side or backend?
                                      |
         +----------------------------+----------------------------+
         |                                                         |
   [Client-Side Bug]                                       [Backend / Edge Bug]
         |                                                         |
1. Immediately PAUSE Play Store staged rollout.           1. Revert Edge Function to previous commit:
2. Tag hotfix release (e.g., v1.0.1, code 2).                `supabase functions deploy ...`
3. Push hotfix to Play Store internal track.             2. Database issue: Restore PITR snapshot
4. Fast-track update approval in Play Console.               without deleting audit logs.
5. Release 100% rollout of hotfix once tested.            3. Flush Redis / in-memory cache.
```

### Staged Rollout Halting Protocol:
1. Log into Google Play Console.
2. Select **Mana Calendar 2027** -> **Release Overview** -> **Production Track**.
3. Click **Halt Rollout** next to release `1.0.0 (1)`.
4. Users who already downloaded `1.0.0` will receive `1.0.1` immediately upon hotfix publishing.
