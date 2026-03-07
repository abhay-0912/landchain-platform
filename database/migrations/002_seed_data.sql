-- =============================================================================
-- Migration: 002_seed_data
-- Description: Seed data for local development and testing
-- Created: 2024-01-01
--
-- Default password for all seed users: password123
-- Hash below is bcrypt with cost factor 10:
--   $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy
-- =============================================================================

BEGIN;

-- =============================================================================
-- USERS  (one per role)
-- =============================================================================
INSERT INTO users (id, full_name, email, password_hash, phone, government_id, role, wallet_address, kyc_status, is_active)
VALUES
    (
        '11111111-1111-1111-1111-111111111111',
        'Arjun Sharma',
        'citizen@landchain.dev',
        '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
        '+91-9876543210',
        'AADHAAR-123456789012',
        'citizen',
        '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
        'verified',
        true
    ),
    (
        '22222222-2222-2222-2222-222222222222',
        'Priya Nair',
        'officer@landchain.dev',
        '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
        '+91-9876543211',
        'GOV-OFF-2024-001',
        'officer',
        '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
        'verified',
        true
    ),
    (
        '33333333-3333-3333-3333-333333333333',
        'State Bank of India',
        'bank@landchain.dev',
        '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
        '+91-1800-112233',
        'BANK-REG-SBI-001',
        'bank',
        '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
        'verified',
        true
    ),
    (
        '44444444-4444-4444-4444-444444444444',
        'Platform Admin',
        'admin@landchain.dev',
        '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
        '+91-9000000000',
        'ADMIN-001',
        'admin',
        '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
        'verified',
        true
    );

-- =============================================================================
-- PROPERTIES
-- =============================================================================
INSERT INTO properties (
    id, property_id, survey_number, owner_id,
    area, coordinates, latitude, longitude,
    city, state, land_type, status,
    blockchain_property_id, blockchain_tx_hash, ipfs_doc_hash,
    registration_date, is_mortgaged
)
VALUES
    (
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        'PROP-MH-2024-001',
        'SRV/MH/PUNE/2024/001',
        '11111111-1111-1111-1111-111111111111',
        1200.0000,
        '18.5204,73.8567',
        18.52040000,
        73.85670000,
        'Pune',
        'Maharashtra',
        'residential',
        'active',
        1,
        '0xabc1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab01',
        'QmTzQ1JRkWErjk39mryYw2WVDzg11jHjpFZctiepFppDm6',
        NOW() - INTERVAL '6 months',
        false
    ),
    (
        'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        'PROP-KA-2024-002',
        'SRV/KA/BLRE/2024/002',
        '11111111-1111-1111-1111-111111111111',
        850.5000,
        '12.9716,77.5946',
        12.97160000,
        77.59460000,
        'Bengaluru',
        'Karnataka',
        'commercial',
        'mortgaged',
        2,
        '0xabc1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab02',
        'QmXnypqrSt1234567890abcdef1234567890abcdef1234567890abcdef123457',
        NOW() - INTERVAL '1 year',
        true
    ),
    (
        'cccccccc-cccc-cccc-cccc-cccccccccccc',
        'PROP-TN-2024-003',
        'SRV/TN/CNNR/2024/003',
        '11111111-1111-1111-1111-111111111111',
        5000.0000,
        '11.1271,78.6569',
        11.12710000,
        78.65690000,
        'Chennai',
        'Tamil Nadu',
        'agricultural',
        'active',
        3,
        '0xabc1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab03',
        'QmAbcDef1234567890abcdef1234567890abcdef1234567890abcdef12345678',
        NOW() - INTERVAL '2 years',
        false
    );

-- =============================================================================
-- OWNERSHIP HISTORY
-- =============================================================================
INSERT INTO ownership_history (property_id, owner_id, transfer_type, transfer_date, notes)
VALUES
    (
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        '11111111-1111-1111-1111-111111111111',
        'registration',
        NOW() - INTERVAL '6 months',
        'Initial registration by owner Arjun Sharma'
    ),
    (
        'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        '11111111-1111-1111-1111-111111111111',
        'registration',
        NOW() - INTERVAL '1 year',
        'Initial registration – commercial plot Bengaluru'
    ),
    (
        'cccccccc-cccc-cccc-cccc-cccccccccccc',
        '11111111-1111-1111-1111-111111111111',
        'registration',
        NOW() - INTERVAL '2 years',
        'Agricultural land registration – inherited from father'
    );

-- =============================================================================
-- MORTGAGES  (active mortgage on property BB)
-- =============================================================================
INSERT INTO mortgages (
    id, property_id, bank_id, loan_amount, loan_account_number,
    start_date, end_date, status,
    blockchain_mortgage_id, blockchain_tx_hash, ipfs_doc_hash, notes
)
VALUES
    (
        'dddddddd-dddd-dddd-dddd-dddddddddddd',
        'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        '33333333-3333-3333-3333-333333333333',
        5000000.00,
        'SBI-LOAN-2024-98765',
        NOW() - INTERVAL '3 months',
        NOW() + INTERVAL '15 years',
        'active',
        1,
        '0xabc1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab04',
        'QmMortgageDoc1234567890abcdef1234567890abcdef12345678901234abcd',
        'Home loan secured against commercial property PROP-KA-2024-002'
    );

-- =============================================================================
-- TAX RECORDS
-- =============================================================================
INSERT INTO tax_records (property_id, tax_year, amount, due_date, paid_date, payment_reference, status)
VALUES
    -- Pune residential (paid 2023, pending 2024)
    (
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        2023, 12500.00,
        '2023-03-31 00:00:00+00',
        '2023-03-15 10:30:00+00',
        'PMC-2023-00123456',
        'paid'
    ),
    (
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        2024, 13200.00,
        '2024-03-31 00:00:00+00',
        NULL,
        NULL,
        'pending'
    ),
    -- Bengaluru commercial (paid 2023, paid 2024)
    (
        'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        2023, 35000.00,
        '2023-03-31 00:00:00+00',
        '2023-02-20 09:00:00+00',
        'BBMP-2023-00987654',
        'paid'
    ),
    (
        'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        2024, 38500.00,
        '2024-03-31 00:00:00+00',
        '2024-02-10 11:45:00+00',
        'BBMP-2024-00112233',
        'paid'
    ),
    -- Chennai agricultural (overdue 2022, paid 2023, pending 2024)
    (
        'cccccccc-cccc-cccc-cccc-cccccccccccc',
        2022, 8000.00,
        '2022-03-31 00:00:00+00',
        NULL,
        NULL,
        'overdue'
    ),
    (
        'cccccccc-cccc-cccc-cccc-cccccccccccc',
        2023, 8500.00,
        '2023-03-31 00:00:00+00',
        '2023-04-05 14:00:00+00',
        'TN-AGRI-2023-00056789',
        'paid'
    ),
    (
        'cccccccc-cccc-cccc-cccc-cccccccccccc',
        2024, 9000.00,
        '2024-03-31 00:00:00+00',
        NULL,
        NULL,
        'pending'
    );

-- =============================================================================
-- AUDIT LOGS  (sample bootstrap entries)
-- =============================================================================
INSERT INTO audit_logs (user_id, action, resource_type, resource_id, ip_address, metadata)
VALUES
    (
        '44444444-4444-4444-4444-444444444444',
        'SEED_DATA_INSERTED',
        'database',
        NULL,
        '127.0.0.1',
        '{"migration": "002_seed_data", "rows_inserted": 4}'::jsonb
    );

COMMIT;
