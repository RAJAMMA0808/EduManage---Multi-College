// server/src/db.ts
import { Pool } from 'pg';
import 'dotenv/config'; // Load environment variables from .env file

// The database connection now uses environment variables.
// Create a file named ".env" in the "server/" directory and add your credentials like this:
//
// DB_USER=your_postgres_username
// DB_HOST=localhost
// DB_DATABASE=edumanage_db
// DB_PASSWORD=your_postgres_password
// DB_PORT=5432
//
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'edumanage.cct0aoe4os1o.us-east-1.rds.amazonaws.com',
  database: process.env.DB_DATABASE || 'edumanage',
  // password: process.env.DB_PASSWORD || 'password',
  password: process.env.DB_PASSWORD || 'Raji0808',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  ssl: {
    rejectUnauthorized: false, // This is important for AWS RDS SSL connections
    ca: `MIIEpgIBAAKCAQEA6F7ghU6PLoFgYjMy7dvfEh7oxXjh2dlim9f/S2EFQCSX3egO
0CAsE8MmM1t2SXy7230JldKLWuC8CJnTZHVxnnw4zejj4cBvVDeHElnAq8qBdLJC
33/lZ+JGmSL1DVA0wuBNLFtKvXRiD/S48SvCm8FX1BqXD989VfpfGeekVK4sx0po
1aD0OjKdNcKkF1xHbdMdtE2r+CZUYQ0k3jBGE6wci80eKlbFf81CxIBCzvEUvSGw
KhFwrb6n3Fjq4muKfCeQfMOsgD7WT5tXTd5++HVp3clruVUNb6enqI1pU9T4Swry
vJbKKSHoqWDYt/aHVWZkcskBmwEnVZaPCSRJ3QIDAQABAoIBAQCGTxCG/LlVsAH9
wIoXYZa16pewTAZ+3F9apKYy84kNYhlFcfPd6DqR0aIq3RqprycF3mfD6UYS6QLG
FeNRlXBuom5S1eGhgpDWpKG1wZrTsODSipaMiGgYe3lC2im54DoeyXbRxJKWnsZv
YovjGeAKFt6lAhl+WxIgt+5wEquxJUFZcyNhFeEg+x/M08aDSF11Q3pu6/p4R98p
dCzTnsjJhE33mT49k/oizwhYWSkNEqoi5aawh7dy70B2+pHfwFXphbYAzbIBbSo7
AyypOYrsFEBlx/PfKNmZghS26f54R+PHWzVKVgtqxzhjMbL22bV2a5RGfOFxj6eZ
eVTBvMshAoGBAPRoTcjdhL1VhZkB+aA8cFBB2OtaT4ctlFRiHT3vpb90mEEYeI8R
q52CHSKXhhYVROMYkHm15wfsMNSEycRZBWa2RUOl4nDdjQ+1Ubtnx95LIXo/6AAQ
xEPRsrSdv6cuBMAh/HBEWDntSndifbsifBeWfYDgXxrzEo4PBuQoW7VrAoGBAPNk
ascVg2kS34Ie//ohNuUvG1dDFGjG4MbypEau4bQkegthVPO4XOzn1m/RfQDxtqJH
FufosAFPl8ApJocwqaEVjU/8Nsyy+UeaCOUS3eKLfQywsWY0L01pppEDyLGkch42
y9DF6fdUv3hX2YEdXgXiek6Ns8FA0l5kBUWXuwfXAoGBALLS6i7QnYGmZFSaVFnA
PvEJ7Lvu3Qdr+v5utzSM9noJxijCzdroM+fPvp+DvDDGKRv76iGTTVHHp8amzbXi
6IfJTw56/h5UjBR1NzLmcR+dWwZGYepCWkfA039BeGvKyOEHPNurtd3UV8rX/mSA
i8j6bCNyh0OBnA7iwckIGmm3AoGBAMGvwo1FYHroavdIphmt/tppH0/U8NPkmBGa
HAKnvrM1Z+3QeeMtbr2UTQBU7C4pLFZ9TgwlDpMsfK2N0bw5jHPFC9x/8Df7oQZK
3RM2bV6P9GZ54eJcWtw23DeAlGBRZgMHRjCQnvyU833YIx1teloifYQvncGHTSGS
ZOOZuFunAoGBANL77AC60/D8kVokgOWKNs8CWIgnyFUyJXj8EMDTBdf0bj4ZWNb3
2Vb/EtQcMNcSMD7jgsVNj6ud19kVmx+K5jCP3bQGqWzzg1YfV6HtKB7jP4PBGiUA
7yhx2D2s4A7LfV8PhN8UrijeicJMThraLIRCufxWjBWB28ckSo5Rx5wl`, // Path to your SSL CA certificate if required
  },
});

//edumanage.cct0aoe4os1o.us-east-1.rds.amazonaws.com
export default pool;