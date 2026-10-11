--
-- PostgreSQL database dump
--

\restrict oGfjxYqg7NKtoNLVACW7vIJOcmFptuz0nFWhuyMWkWraflNHrapcteemxadKeZD

-- Dumped from database version 16.14 (Debian 16.14-1.pgdg13+1)
-- Dumped by pg_dump version 18.3

-- Started on 2026-10-09 22:33:03

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 3557 (class 0 OID 49174)
-- Dependencies: 225
-- Data for Name: app_users; Type: TABLE DATA; Schema: cultural; Owner: admin
--

COPY cultural.app_users (id, display_name, email, password_hash, created_at) FROM stdin;
2	Arghya Chowdhury	chowdhuryarghya@gmail.com	scrypt$16384$8$1$MCSRQrVKosf1MVvIL19Lpg$l9VLzsyhOfyqPnufZz6kHwaakF2sUPwQjsoY5a2bO_-IBqF6s6HYHMh3JbH1HXj-I_C1DgFHsPQlaszkQZ3tfg	2026-10-04 15:19:23.074966+00
\.


--
-- TOC entry 3559 (class 0 OID 49186)
-- Dependencies: 227
-- Data for Name: auth_sessions; Type: TABLE DATA; Schema: cultural; Owner: admin
--

COPY cultural.auth_sessions (id, user_id, token_hash, expires_at, created_at) FROM stdin;
\.


--
-- TOC entry 3551 (class 0 OID 24586)
-- Dependencies: 219
-- Data for Name: events; Type: TABLE DATA; Schema: cultural; Owner: admin
--

COPY cultural.events (id, financial_year_id, name, description, event_date, budget, status, created_at, updated_at) FROM stdin;
1	1	Rabindra-Nazrul	Annual Rabindra Nazrul Celebration	2027-01-24	20000.00	COMPLETED	2026-06-13 05:32:57.495715	2026-06-13 05:33:10.843345
4	1	Khuti Puja	Khuti Puja Event expenses to be covered under this event name	2026-09-05	2500.00	COMPLETED	2026-10-02 06:44:18.875445	2026-10-02 06:44:18.875445
2	1	Independence Day	Independence Day Event	2026-08-14	6500.00	COMPLETED	2026-06-13 05:41:51.605412	2026-06-13 05:41:51.605412
3	1	Durga Puja	Durga Puja	2026-08-18	431100.00	ACTIVE	2026-06-21 14:31:38.881092	2026-06-21 14:31:38.881092
\.


--
-- TOC entry 3553 (class 0 OID 24614)
-- Dependencies: 221
-- Data for Name: expenses; Type: TABLE DATA; Schema: cultural; Owner: admin
--

COPY cultural.expenses (id, event_id, category, vendor, amount, expense_date, paid_by, payment_mode, notes, bill_image_path, is_deleted) FROM stdin;
11	2	Sound	Sound	10.00	2026-07-21	Music	Cash		uploads\\bills\\1782053992709-Page1.png	t
4	1	Misc	Saikat Mukherjee	120.00	2026-06-13	Treasurer	Cash	test	\N	t
12	2	Food	Drisana	100.00	2026-06-29	Treasurer	Cash		uploads\\bills\\1782056326133-Page1.png	t
6	1	Decoration	Rudra	5000.00	2026-06-13	Treasurer	Cash	Decoration	\N	t
1	1	Flex	Sudeep Roy	1260.00	2026-06-12	Treasurer	Cash	Flex Print Cost	\N	t
3	1	Soft Drinks	Sudeep Roy	280.00	2026-06-12	Treasurer	Cash	Soft Drinks for Kids	\N	t
14	1	Misc	Saikat Mukherjee	120.00	2026-06-23	Treasurer	Cash		uploads\\bills\\1782571101138-Screenshot 2026-06-07 134424.png	t
13	1	Printing	Sudeep Roy	1260.00	2026-06-13	Treasurer	Cash		uploads\\bills\\1782056635044-Sudip_Flex.jpeg	t
15	1	Food	Sudeep Roy	1540.00	2026-06-11	Cultural Treasurer	Cash	Flex, Fruti, Litchi	\N	f
16	1	Decoration	Saikat Mukherjee	120.00	2026-06-06	Cultural Treasurer	Cash	Rajanigandha Mala	\N	f
17	1	Decoration	Rudrarup Sarkar	8000.00	2026-06-09	Cultural Treasurer	Cash	Stage, Chair	\N	f
18	4	Misc	Anjan Sengupta	514.00	2026-09-06	Cultural Treasurer	Cash	Khuti Puja Expense	\N	f
19	2	Food	Debopam Rakshit	5300.00	2026-08-23	Cultural Treasurer	Cash	Breakfast	\N	f
20	2	Food	Sudeep Roy	1100.00	2026-08-23	Cultural Treasurer	Cash	Breakfast refill (shortage from Misti Mukh)	\N	f
21	2	Decoration	Sudeep Roy	270.00	2026-08-23	Cultural Treasurer	Cash	Flower	\N	f
22	2	Decoration	Ujjwal Mondal	240.00	2026-09-05	Cultural Treasurer	Cash	Flower	\N	f
23	3	Misc	Krishnendu Mukherjee	5000.00	2026-06-06	Cultural Treasurer	Cash	Durga Pratima Idol Booking	\N	f
24	3	Misc	Pijush Bhattacharya	1001.00	2026-09-01	Cultural Treasurer	Cash	Purohit (Adv Payment)	\N	f
25	3	Decoration	Krishnendu Mukherjee	3132.00	2026-09-13	Cultural Treasurer	Cash	Ply, Primar	\N	f
26	3	Decoration	Sudeep Roy	560.00	2026-07-19	Cultural Treasurer	Cash	Decoration item (pencil, brush, acrylic, rubber, tissue)	\N	f
28	3	Decoration	Rudrarup Sarkar	10000.00	2026-09-16	Cultural Treasurer	Cash	Advance Payment for Pandel	\N	f
29	4	Decoration	Ujjwal Mondal	700.00	2026-09-06	Cultural Treasurer	Cash	Flowers	\N	f
30	2	Decoration	Palash Sardar	842.00	2026-08-13	Cultural Treasurer	Cash	Bamboo, Flag etc	\N	f
31	2	Food	Palash Sardar	820.00	2026-08-14	Cultural Treasurer	Cash	Chocolates	\N	f
32	2	Food	Subhankar Naskar	120.00	2026-08-15	Cultural Treasurer	Cash	Drinking Water	\N	f
27	3	Decoration	Sudeep Roy	2209.00	2026-09-26	Cultural Treasurer	Cash	Decoration item (acrylic paint, marker, brush)	\N	f
33	3	Decoration	Rudrarup Sarkar	10000.00	2026-08-26	Cultural Treasurer	Cash	Advance Payment Pandel	\N	f
34	3	Decoration	Rudrarup Sarkar	20000.00	2026-08-26	Cultural Treasurer	Cash	Advance Payment for Pandel	\N	f
35	3	Misc	Palash Sardar	400.00	2026-09-29	Cultural Treasurer	Cash	Drum Pcs	\N	f
36	3	Decoration	Palash Sardar 	572.00	2026-09-19	Cultural Treasurer	Cash	Studio Items	\N	f
37	3	Decoration	Palash Sardar	165.00	2026-10-01	Cultural Treasurer	Cash	Thermocol	\N	f
38	3	Decoration	Palash Sardar	750.00	2026-09-22	Cultural Treasurer	Cash	Marine 2KG	\N	f
39	3	Decoration	Subhankar Naskar	160.00	2026-09-22	Cultural Treasurer	Cash	Drinking Water (Studio)	\N	f
40	3	Decoration	Design-N-Net	1100.00	2026-09-16	Cultural Treasurer	Cash	Flex 5X3	\N	f
\.


--
-- TOC entry 3549 (class 0 OID 24579)
-- Dependencies: 217
-- Data for Name: financial_year; Type: TABLE DATA; Schema: cultural; Owner: admin
--

COPY cultural.financial_year (id, name, start_date, end_date) FROM stdin;
1	FY 2026-27	2026-04-01	2027-03-31
\.


--
-- TOC entry 3555 (class 0 OID 49158)
-- Dependencies: 223
-- Data for Name: income; Type: TABLE DATA; Schema: cultural; Owner: admin
--

COPY cultural.income (id, event_id, source, amount, income_date, received_from, block, flat_no, payment_mode, notes, is_deleted, payment_status) FROM stdin;
116	3	Subscription	4000.00	2026-10-04	Biswa Bijoy Bhattacharjee	B	1D	NEFT		f	Paid
119	3	Subscription	4000.00	2026-10-06	Suvasish Guhathakurata	B	2D	NEFT		f	Paid
122	3	Subscription	4000.00	2026-10-09	Ajoy Majhi	E	4A	NEFT		f	Paid
125	3	Subscription	4000.00	2026-10-09	Rita Chakroborty Hazra	F	2B	Cheque		f	Paid
83	3	Puja Donation	10000.00	2026-09-11	Debojyoti Kar	G	2D	NEFT	Paid (Durga Pratima)	f	Paid
1	3	Subscription	4000.00	2026-08-09	Krishnendu Mukherjee	F	3B	NEFT	\N	f	Paid
2	3	Subscription	4000.00	2026-08-09	Sushanta Das	C	4B	NEFT	\N	f	Paid
3	3	Subscription	4000.00	2026-08-09	Souvik Kumar Ghosh	C	2B	NEFT	\N	f	Paid
71	3	Sponsorship	7000.00	2026-04-30	Radio FM	\N	\N	NEFT	\N	f	Paid
72	3	Sponsorship	1600.00	2026-05-18	Metro Cash & Carry	\N	\N	NEFT	\N	f	Paid
73	3	Sponsorship	3000.00	2026-05-29	Metro Cash & Carry	\N	\N	NEFT	\N	f	Paid
74	3	Sponsorship	3000.00	2026-07-15	Himalaya Optical	\N	\N	NEFT	\N	f	Paid
75	3	Sponsorship	3000.00	2026-08-16	Sampurna	\N	\N	NEFT	\N	f	Paid
76	3	Sponsorship	9001.00	2026-09-07	Sampurna	\N	\N	NEFT	\N	f	Paid
77	3	Sponsorship	5000.00	2026-09-15	Mr. NAJIB MOHAMMAD SEK	\N	\N	NEFT	\N	f	Paid
78	3	Sponsorship	8000.00	2026-09-17	Manipal	\N	\N	NEFT	\N	f	Paid
79	3	Sponsorship	5000.00	2026-09-30	Amit Singh	\N	\N	NEFT	\N	f	Paid
117	3	Subscription	4000.00	2026-10-05	Sailesh Sinha	C	2A	NEFT		f	Paid
120	3	Subscription	4000.00	2026-10-08	Shyam Kumar	G	1A	NEFT		f	Paid
123	3	Subscription	4000.00	2026-10-09	Srikant Rai	G	2C	NEFT		f	Paid
4	3	Subscription	4000.00	2026-08-11	Tridip Bhattacharya	F	2E	NEFT	\N	f	Paid
5	3	Subscription	4000.00	2026-08-12	Koushik Banerjee	F	3E	NEFT	\N	f	Paid
6	3	Subscription	4000.00	2026-08-13	Sadananda Ghosh	G	3G	NEFT	\N	f	Paid
7	3	Subscription	4000.00	2026-08-14	Arunava Saha	B	1C	NEFT	\N	f	Paid
108	3	Puja Donation	2200.00	2026-09-20	Narasimhan Godavarthy	A	1E	NEFT	Paid (Navami Mool Bhog)	f	Paid
106	3	Puja Donation	1800.00	2026-09-20	Santanu Ghosh	A	3D	NEFT	Pending (Sasthi Puja)	f	Pending
103	3	Puja Donation	2600.00	2026-09-15	Sanjay Pradhan	B	1A	NEFT	Paid (Astami Mool Bhog)	f	Paid
100	3	Puja Donation	2500.00	2026-09-13	Sandipta Mukherjee	F	3B	NEFT	Paid (Astami Sandhi Puja)	f	Paid
96	3	Puja Donation	3300.00	2026-08-30	Ujjwal Mondal	A	2E	NEFT	Paid (Padma Phool)	f	Paid
87	3	Puja Donation	3500.00	2026-08-31	Tridip Bhattacharya	F	2E	NEFT	Paid (Laksmi Pratima)	f	Paid
93	3	Puja Donation	1500.00	2026-08-31	Tridip Bhattacharya	F	2E	NEFT	Paid (Laksmi Puja)	f	Paid
84	3	Puja Donation	5000.00	2026-09-06	Krishnendu Mukherjee	F	3B	NEFT	Paid (Durga Pratima Astra)	f	Paid
86	3	Puja Donation	10000.00	2026-08-31	Arghya Chowdhury	A	4E	NEFT	Paid (Durga Pratima)	f	Paid
88	3	Puja Donation	1800.00	2026-08-30	Sulagna Mukherjee	H	2B	NEFT	Paid (Sasthi Puja)	f	Paid
80	3	Puja Donation	25000.00	2026-09-03	Nilanjan Saha	H	2A	Cash	Paid (Durga Pratima)	f	Paid
81	3	Puja Donation	10001.00	2026-09-04	Debopam Rakshit	B	2A	NEFT	Pending (Durga Pratima)	f	Pending
82	3	Puja Donation	10000.00	2026-09-11	Biprajeet Kar	A	1C	NEFT	Pending (Durga Pratima)	f	Pending
85	3	Puja Donation	6000.00	2026-08-31	Pradipta Roy	D	2A	NEFT	Pending (Kali Pratima)	f	Pending
89	3	Puja Donation	2300.00	2026-09-11	Biswajit Kar	A	1C	NEFT	Pending (Astami Puja)	f	Pending
90	3	Puja Donation	2300.00	2026-09-06	Sourav Datta	D	1B	NEFT	Pending (Astami Puja)	f	Pending
91	3	Puja Donation	2200.00	2026-09-11	Bhaskar Mukherjee	G	3E	NEFT	Pending (Saptami Mool Bhog)	f	Pending
92	3	Puja Donation	2200.00	2026-09-06	Satish Kumar	C	4A	NEFT	Pending (Navami Mool Bhog)	f	Pending
94	3	Puja Donation	3400.00	2026-08-31	Sulagna Mukherjee	H	2B	NEFT	Pending (Kali Puja)	f	Pending
95	3	Puja Donation	2800.00	2026-09-06	Sourav Datta	D	1B	NEFT	Pending (Saraswati Puja)	f	Pending
97	3	Puja Donation	9000.00	2026-09-15	Santanu Ghosh	A	3D	NEFT	Pending (Saraswati Pratima)	f	Pending
98	3	Puja Donation	11500.00	2026-09-15	Sabyasachi Das	F	4E	NEFT	Pending (Durga Pujer Phool)	f	Pending
99	3	Puja Donation	1800.00	2026-09-16	Mousumi Das	H	1B	NEFT	Pending (Sasthi Puja)	f	Pending
101	3	Puja Donation	2100.00	2026-09-16	Ritwik Bhattacharya	B	4D	NEFT	Pending (Saptami Puja)	f	Pending
102	3	Puja Donation	2600.00	2026-09-16	Pradipta Roy	D	2A	NEFT	Pending (Sandhi Puja Bhog)	f	Pending
104	3	Puja Donation	2300.00	2026-09-17	Kaushik Laskar	C	2D	NEFT	Pending (Navami Puja)	f	Pending
105	3	Puja Donation	2600.00	2026-09-17	Gautam Kr Mondal	D	4A	NEFT	Pending (Astami Mool Bhog)	f	Pending
107	3	Puja Donation	3400.00	2026-09-21	Santanu Ghosh	A	3D	NEFT	Pending (Kali Puja Bhog)	f	Pending
8	3	Subscription	4000.00	2026-08-15	Debshankar Satpathi	H	1C	NEFT	\N	f	Paid
9	3	Subscription	4000.00	2026-08-17	Avishek Sengupta	C	1A	NEFT	\N	f	Paid
10	3	Subscription	4000.00	2026-08-26	Arghya Chowdhury	A	4E	NEFT	\N	f	Paid
11	3	Subscription	4000.00	2026-08-29	Kaushik Laskar	C	2D	NEFT	\N	f	Paid
12	3	Subscription	4000.00	2026-08-29	Shailandra Kumar	F	1A	NEFT	\N	f	Paid
13	3	Subscription	4000.00	2026-08-31	Tarun Mondal	E	1B	NEFT	\N	f	Paid
14	3	Subscription	4000.00	2026-08-31	Subhadip Das	F	1B	Cheque	\N	f	Paid
15	3	Subscription	4000.00	2026-09-01	Santu Nandy	G	2E	NEFT	\N	f	Paid
16	3	Subscription	4000.00	2026-09-03	Koushik Jana	D	3B	NEFT	\N	f	Paid
17	3	Subscription	4000.00	2026-09-04	Biplab Kumar Maity	G	1G	NEFT	\N	f	Paid
18	3	Subscription	4000.00	2026-09-06	Srijan Bhattacharya	B	2B	NEFT	\N	f	Paid
19	3	Subscription	4000.00	2026-08-10	Nilanjan Saha	H	1A	Cash	\N	f	Paid
20	3	Subscription	4000.00	2026-08-28	Santanu Chakraborti	B	4C	NEFT	\N	f	Paid
21	3	Subscription	4000.00	2026-09-01	Monmohan Ghosh	F	2F	NEFT	\N	f	Paid
22	3	Subscription	4000.00	2026-09-06	Biswajit Kar	A	1C	NEFT	\N	f	Paid
23	3	Subscription	4000.00	2026-09-06	Koushik Sarkar	A	4A	NEFT	\N	f	Paid
24	3	Subscription	4000.00	2026-09-06	Sabyasachi Das	F	4E	NEFT	\N	f	Paid
25	3	Subscription	4000.00	2026-09-07	Saikat Mukherjee	H	2B	NEFT	\N	f	Paid
26	3	Subscription	4000.00	2026-09-07	Swapan Kr Dutta	A	3A	NEFT	\N	f	Paid
27	3	Subscription	4000.00	2026-09-08	Aparajita Das	D	2B	NEFT	\N	f	Paid
28	3	Subscription	4000.00	2026-09-09	Sourav Datta	D	1B	NEFT	\N	f	Paid
29	3	Subscription	4000.00	2026-09-14	Narasimhan Godavarthy	A	1E	NEFT	\N	f	Paid
30	3	Subscription	4000.00	2026-09-15	Partha Pratim Sengupta	C	1C	NEFT	\N	f	Paid
31	3	Subscription	4000.00	2026-09-15	MANOJ KANTI GHOSH	A	2A	NEFT	\N	f	Paid
32	3	Subscription	4000.00	2026-09-15	Arnab Vattacharya	G	2F	NEFT	\N	f	Paid
33	3	Subscription	4000.00	2026-09-17	Goutam Kumar Mondal	D	4A	NEFT	\N	f	Paid
34	3	Subscription	4000.00	2026-09-19	Nayan Basu	A	4C	NEFT	\N	f	Paid
35	3	Subscription	4000.00	2026-09-19	BHASKER VINEET	H	3A	NEFT	\N	f	Paid
36	3	Subscription	4000.00	2026-09-20	Nitish Kumar	F	1E	NEFT	\N	f	Paid
37	3	Subscription	4000.00	2026-09-20	DrPrasun Sardar	E	3A	NEFT	\N	f	Paid
38	3	Subscription	4000.00	2026-09-20	Sudit Sengupta	G	4F	NEFT	\N	f	Paid
39	3	Subscription	4000.00	2026-09-20	Satish Kumar	C	4A	NEFT	\N	f	Paid
40	3	Subscription	4000.00	2026-09-21	Ujjwal mondal	A	2E	NEFT	\N	f	Paid
41	3	Subscription	4000.00	2026-09-22	Anupam Ghosh	F	2D	NEFT	\N	f	Paid
109	3	Sponsorship	5000.00	2026-10-01	Cool Mind Solution	\N	\N	NEFT		f	Paid
110	3	Sponsorship	5000.00	2026-10-03	Mahaveer Engineering	\N	\N	NEFT		f	Paid
126	3	Subscription	4000.00	2026-10-09	Rita Chakroborty Hazra	F	2B	Cheque		t	Paid
42	3	Subscription	4000.00	2026-09-22	BHASKAR BHAUMIK	G	3A	NEFT	\N	f	Paid
43	3	Subscription	4000.00	2026-09-23	Baby Chattopadhyay	G	3B	NEFT	\N	f	Paid
44	3	Subscription	4000.00	2026-09-23	Siddhartha Roy	G	4B	NEFT	\N	f	Paid
45	3	Subscription	4000.00	2026-09-23	Manipushpak Dey	F	2A	NEFT	\N	f	Paid
46	3	Subscription	4000.00	2026-09-23	DrParthopratim Chakroborty	G	4A	NEFT	\N	f	Paid
47	3	Subscription	4000.00	2026-09-23	Tapan Kumar Dutta	A	2F	NEFT	\N	f	Paid
48	3	Subscription	4000.00	2026-09-24	ARIJIT DATTA GUPTA	A	4F	NEFT	\N	f	Paid
49	3	Subscription	4000.00	2026-09-24	Gopal Chandra Debnath	G	2G	Cheque	\N	f	Paid
50	3	Subscription	4000.00	2026-09-26	Mithilesh Sekhar	E	1A	NEFT	\N	f	Paid
51	3	Subscription	4000.00	2026-09-27	Kul Vaibhav	F	3D	NEFT	\N	f	Paid
52	3	Subscription	4000.00	2026-09-27	J P Panja	G	1F	NEFT	\N	f	Paid
53	3	Subscription	4000.00	2026-09-27	Arup Mondal	B	3C	NEFT	\N	f	Paid
54	3	Subscription	4000.00	2026-09-28	Tarasankar Bandyopadhyay	F	3F	NEFT	\N	f	Paid
55	3	Subscription	4000.00	2026-09-28	Nilratan Panda	F	2C	NEFT	\N	f	Paid
56	3	Subscription	4000.00	2026-09-28	D Ghosh	A	3D	NEFT	\N	f	Paid
57	3	Subscription	4000.00	2026-09-29	Sujit Kumar Rath	A	4B	NEFT	\N	f	Paid
58	3	Subscription	4000.00	2026-09-29	Ritwik Bhattacharyya	B	4D	NEFT	\N	f	Paid
59	3	Subscription	4000.00	2026-09-30	Sanjay ghosh	F	4A	NEFT	\N	f	Paid
60	3	Subscription	4000.00	2026-09-30	Kalpana Sengupta	C	3D	NEFT	\N	f	Paid
61	3	Subscription	4000.00	2026-09-30	Dwaipayan Kundu	D	1A	NEFT	\N	f	Paid
62	3	Subscription	4000.00	2026-09-30	Sudip Roy	D	2A	NEFT	\N	f	Paid
63	3	Subscription	4000.00	2026-09-30	Sushil Rai	H	2C	NEFT	\N	f	Paid
64	3	Subscription	4000.00	2026-09-29	Kunal Das	B	3A	NEFT	\N	f	Paid
65	3	Subscription	4000.00	2026-09-29	Rama Roy	C	4D	Cheque	\N	f	Paid
66	3	Subscription	4000.00	2026-10-02	Amlan Chakraborty	A	1A	NEFT	\N	f	Paid
67	3	Subscription	4000.00	2026-10-02	Debopam Rakshit	C	3C	NEFT	\N	f	Paid
68	3	Subscription	4000.00	2026-10-01	Laxmikanta Mondal	B	3D	Cheque	\N	f	Paid
69	3	Subscription	4000.00	2026-09-30	Alok Mitra	E	3B	NEFT	\N	f	Paid
70	3	Subscription	4000.00	2026-10-03	PARTHAJIT PRAMANICK	H	4A	NEFT	\N	f	Paid
111	3	Subscription	4000.00	2026-10-01	Ritaprava Bandyopadhyay	C	1B	NEFT		f	Paid
112	3	Subscription	4000.00	2026-10-02	Prasanta Kumar Khatua	C	4C	NEFT		f	Paid
113	3	Subscription	4000.00	2026-10-02	Sanjay Pradhan	B	1A	NEFT		f	Paid
114	3	Subscription	4000.00	2026-10-03	Dilip Kumar Paul	F	1F	NEFT		f	Paid
115	3	Subscription	4000.00	2026-10-04	Subinay Chahule	G	4E	NEFT		f	Paid
118	3	Subscription	4000.00	2026-10-06	Animesh Mondal	B	2C	NEFT		f	Paid
121	3	Subscription	4000.00	2026-10-08	Rupam Roy	H	2D	NEFT		f	Paid
124	3	Sponsorship	5000.00	2026-10-09	Kinjal Technologies Pvt Ltd	\N	\N	NEFT		f	Paid
\.


--
-- TOC entry 3561 (class 0 OID 49203)
-- Dependencies: 229
-- Data for Name: meal_menu_options; Type: TABLE DATA; Schema: cultural; Owner: admin
--

COPY cultural.meal_menu_options (id, meal_date, day_label, meal, option_code, meal_type, description, price, display_order) FROM stdin;
1	2026-10-17	Saptami-1 (Saturday)	Breakfast	veg	Veg	Hinger Kochuri + Cholar Dal + Misti	50.00	1
2	2026-10-17	Saptami-1 (Saturday)	Lunch	veg	Veg	Rice + Sukto + Veg Dal + Kumroli + Potoler Dolma + Chutney + Papad	150.00	1
3	2026-10-17	Saptami-1 (Saturday)	Lunch	non-veg	Non-Veg	Rice + Sukto + Veg Dal + Kumroli + Rui Kalia + Chutney + Papad	180.00	2
4	2026-10-17	Saptami-1 (Saturday)	Dinner	veg	Veg	Lachha Paratha + Paneer Veg Navaratna + Salad + Mishti	160.00	1
5	2026-10-17	Saptami-1 (Saturday)	Dinner	non-veg	Non-Veg	Lachha Paratha + Kadai Chicken + Salad + Mishti	170.00	2
6	2026-10-18	Saptami-2 (Sunday)	Breakfast	veg	Veg	Kachuri + Aloo Dum + Jalebi	50.00	1
7	2026-10-18	Saptami-2 (Sunday)	Lunch	veg	Veg	Rice + Moong Dal + Fool kophi er Roast + Jhuri Aloo Bhaja + Paneer Kofta Curry + Chutney + Papad	175.00	1
8	2026-10-18	Saptami-2 (Sunday)	Lunch	non-veg	Non-Veg	Rice + Moong Dal + Fool kophi er Roast + Jhuri Aloo Bhaja + Doi Katla + Chutney + Papad	190.00	2
9	2026-10-18	Saptami-2 (Sunday)	Dinner	veg	Veg	Polao + Sahi Paneer + Salad	160.00	1
10	2026-10-18	Saptami-2 (Sunday)	Dinner	non-veg	Non-Veg	Polao + Chicken Rezala + Salad	170.00	2
11	2026-10-19	Astami (Monday)	Breakfast	veg	Veg	Luchi + Sada Aloo Tarkari + Mishti	50.00	1
12	2026-10-19	Astami (Monday)	Lunch	complimentary	Veg	Khichuri + Beguni + Labra + Chutney + Papad + Payesh (Complimentary)	0.00	1
13	2026-10-19	Astami (Monday)	Lunch	paid	Veg	Khichuri + Beguni + Labra + Chutney + Papad + Payesh (Paid)	125.00	2
14	2026-10-19	Astami (Monday)	Dinner	veg	Veg	Koraisutir Kochuri + Stuffed Potato + Cholar Dal	150.00	1
15	2026-10-20	Nabami (Tuesday)	Breakfast	veg	Veg	Bread/Moori + Ghugni + Bonde	50.00	1
16	2026-10-20	Nabami (Tuesday)	Lunch	veg	Veg	Rice + Moong Dal + Jhuri Aloo Bhaja + Chana er Curry + Dhokar Dalna + Chutney + Papad	210.00	1
17	2026-10-20	Nabami (Tuesday)	Lunch	mutton	Non-Veg	Rice + Moong Dal + Jhuri Aloo Bhaja + Mutton Kosha + Chutney + Papad	340.00	2
18	2026-10-20	Nabami (Tuesday)	Lunch	chicken	Non-Veg	Rice + Moong Dal + Jhuri Aloo Bhaja + Chicken Kosha + Chutney + Papad	210.00	3
19	2026-10-20	Nabami (Tuesday)	Dinner	veg	Veg	Veg Chop + Veg Fried Rice + Chili Manchurian	175.00	1
20	2026-10-20	Nabami (Tuesday)	Dinner	non-veg	Non-Veg	Veg Chop + Veg Fried Rice + Chilli Chicken	190.00	2
21	2026-10-21	Dashami (Wednesday)	Breakfast	veg	Veg	Dalpuri + Cholar Dal + Misti	50.00	1
22	2026-10-21	Dashami (Wednesday)	Lunch	veg	Veg	Rice + Biuli er Daal + Aloo Posto + Veg Kofta Curry + Chutney + Papad	185.00	1
23	2026-10-21	Dashami (Wednesday)	Lunch	non-veg	Non-Veg	Rice + Biuli er Daal + Aloo Posto + Sorshe Pabda + Chutney + Papad	205.00	2
24	2026-10-21	Dashami (Wednesday)	Dinner	veg	Veg	Basanti Polao + Paneer Butter Masala	180.00	1
25	2026-10-21	Dashami (Wednesday)	Dinner	non-veg	Non-Veg	Basanti Polao + Chicken Dak Bunglow	200.00	2
\.


--
-- TOC entry 3567 (class 0 OID 49260)
-- Dependencies: 235
-- Data for Name: meal_order_blocks; Type: TABLE DATA; Schema: cultural; Owner: admin
--

COPY cultural.meal_order_blocks (id, name, is_active) FROM stdin;
1	A	t
2	B	t
3	C	t
4	D	t
5	E	t
6	F	t
7	G	t
8	H	t
\.


--
-- TOC entry 3569 (class 0 OID 49270)
-- Dependencies: 237
-- Data for Name: meal_order_flats; Type: TABLE DATA; Schema: cultural; Owner: admin
--

COPY cultural.meal_order_flats (id, block_id, flat_no, is_active, owner_name) FROM stdin;
1	1	1A	t	\N
2	1	1B	t	\N
3	1	1C	t	\N
4	1	1D	t	\N
5	1	1E	t	\N
6	1	1F	t	\N
7	2	1A	t	\N
8	2	1B	t	\N
9	2	1C	t	\N
10	2	1D	t	\N
11	3	1A	t	\N
12	3	1B	t	\N
13	3	1C	t	\N
14	3	1D	t	\N
15	4	1A	t	\N
16	4	1B	t	\N
17	5	1A	t	\N
18	5	1B	t	\N
19	6	1A	t	\N
20	6	1B	t	\N
21	6	1C	t	\N
22	6	1D	t	\N
23	6	1E	t	\N
24	6	1F	t	\N
25	7	1A	t	\N
26	7	1B	t	\N
27	7	1C	t	\N
28	7	1D	t	\N
29	7	1E	t	\N
30	7	1F	t	\N
31	7	1G	t	\N
32	8	1A	t	\N
33	8	1B	t	\N
34	8	1C	t	\N
35	8	1D	t	\N
36	1	2A	t	\N
37	1	2B	t	\N
38	1	2C	t	\N
39	1	2D	t	\N
40	1	2E	t	\N
41	1	2F	t	\N
42	2	2A	t	\N
43	2	2B	t	\N
44	2	2C	t	\N
45	2	2D	t	\N
46	3	2A	t	\N
47	3	2B	t	\N
48	3	2C	t	\N
49	3	2D	t	\N
50	4	2A	t	\N
51	4	2B	t	\N
52	5	2A	t	\N
53	5	2B	t	\N
54	6	2A	t	\N
55	6	2B	t	\N
56	6	2C	t	\N
57	6	2D	t	\N
58	6	2E	t	\N
59	6	2F	t	\N
60	7	2A	t	\N
61	7	2B	t	\N
62	7	2C	t	\N
63	7	2D	t	\N
64	7	2E	t	\N
65	7	2F	t	\N
66	7	2G	t	\N
67	8	2A	t	\N
68	8	2B	t	\N
69	8	2C	t	\N
70	8	2D	t	\N
71	1	3A	t	\N
72	1	3B	t	\N
73	1	3C	t	\N
74	1	3D	t	\N
75	1	3E	t	\N
76	1	3F	t	\N
77	2	3A	t	\N
78	2	3B	t	\N
79	2	3C	t	\N
80	2	3D	t	\N
81	3	3A	t	\N
82	3	3B	t	\N
83	3	3C	t	\N
84	3	3D	t	\N
85	4	3A	t	\N
86	4	3B	t	\N
87	5	3A	t	\N
88	5	3B	t	\N
89	6	3A	t	\N
90	6	3B	t	\N
91	6	3C	t	\N
92	6	3D	t	\N
93	6	3E	t	\N
94	6	3F	t	\N
95	7	3A	t	\N
96	7	3B	t	\N
97	7	3C	t	\N
98	7	3D	t	\N
99	7	3E	t	\N
100	7	3F	t	\N
101	7	3G	t	\N
102	8	3A	t	\N
103	8	3B	t	\N
104	8	3C	t	\N
105	8	3D	t	\N
106	1	4A	t	\N
107	1	4B	t	\N
108	1	4C	t	\N
109	1	4D	t	\N
110	1	4E	t	\N
111	1	4F	t	\N
112	2	4A	t	\N
113	2	4B	t	\N
114	2	4C	t	\N
115	2	4D	t	\N
116	3	4A	t	\N
117	3	4B	t	\N
118	3	4C	t	\N
119	3	4D	t	\N
120	4	4A	t	\N
121	4	4B	t	\N
122	5	4A	t	\N
123	5	4B	t	\N
124	6	4A	t	\N
125	6	4B	t	\N
126	6	4C	t	\N
127	6	4D	t	\N
128	6	4E	t	\N
129	6	4F	t	\N
130	7	4A	t	\N
131	7	4B	t	\N
132	7	4C	t	\N
133	7	4D	t	\N
134	7	4E	t	\N
135	7	4F	t	\N
136	7	4G	t	\N
137	8	4A	t	\N
138	8	4B	t	\N
139	8	4C	t	\N
140	8	4D	t	\N
\.


--
-- TOC entry 3565 (class 0 OID 49231)
-- Dependencies: 233
-- Data for Name: meal_order_items; Type: TABLE DATA; Schema: cultural; Owner: admin
--

COPY cultural.meal_order_items (id, order_id, menu_option_id, meal_date, day_label, meal, meal_type, option_code, description, price, head_count) FROM stdin;
26	3	7	2026-10-18	Saptami-2 (Sunday)	Lunch	Veg	veg	Rice + Moong Dal + Fool kophi er Roast + Jhuri Aloo Bhaja + Paneer Kofta Curry + Chutney + Papad	175.00	2
27	3	8	2026-10-18	Saptami-2 (Sunday)	Lunch	Non-Veg	non-veg	Rice + Moong Dal + Fool kophi er Roast + Jhuri Aloo Bhaja + Doi Katla + Chutney + Papad	190.00	5
\.


--
-- TOC entry 3570 (class 0 OID 49284)
-- Dependencies: 238
-- Data for Name: meal_order_settings; Type: TABLE DATA; Schema: cultural; Owner: admin
--

COPY cultural.meal_order_settings (singleton, subscription_event_id) FROM stdin;
t	3
\.


--
-- TOC entry 3563 (class 0 OID 49217)
-- Dependencies: 231
-- Data for Name: meal_orders; Type: TABLE DATA; Schema: cultural; Owner: admin
--

COPY cultural.meal_orders (id, created_by, block, flat_no, total_amount, created_at) FROM stdin;
3	2	G	4A	1300.00	2026-10-08 15:19:34.64646+00
\.


--
-- TOC entry 3587 (class 0 OID 0)
-- Dependencies: 224
-- Name: app_users_id_seq; Type: SEQUENCE SET; Schema: cultural; Owner: admin
--

SELECT pg_catalog.setval('cultural.app_users_id_seq', 2, true);


--
-- TOC entry 3588 (class 0 OID 0)
-- Dependencies: 226
-- Name: auth_sessions_id_seq; Type: SEQUENCE SET; Schema: cultural; Owner: admin
--

SELECT pg_catalog.setval('cultural.auth_sessions_id_seq', 7, true);


--
-- TOC entry 3589 (class 0 OID 0)
-- Dependencies: 218
-- Name: events_id_seq; Type: SEQUENCE SET; Schema: cultural; Owner: admin
--

SELECT pg_catalog.setval('cultural.events_id_seq', 4, true);


--
-- TOC entry 3590 (class 0 OID 0)
-- Dependencies: 220
-- Name: expenses_id_seq; Type: SEQUENCE SET; Schema: cultural; Owner: admin
--

SELECT pg_catalog.setval('cultural.expenses_id_seq', 40, true);


--
-- TOC entry 3591 (class 0 OID 0)
-- Dependencies: 216
-- Name: financial_year_id_seq; Type: SEQUENCE SET; Schema: cultural; Owner: admin
--

SELECT pg_catalog.setval('cultural.financial_year_id_seq', 1, true);


--
-- TOC entry 3592 (class 0 OID 0)
-- Dependencies: 222
-- Name: income_id_seq; Type: SEQUENCE SET; Schema: cultural; Owner: admin
--

SELECT pg_catalog.setval('cultural.income_id_seq', 126, true);


--
-- TOC entry 3593 (class 0 OID 0)
-- Dependencies: 228
-- Name: meal_menu_options_id_seq; Type: SEQUENCE SET; Schema: cultural; Owner: admin
--

SELECT pg_catalog.setval('cultural.meal_menu_options_id_seq', 25, true);


--
-- TOC entry 3594 (class 0 OID 0)
-- Dependencies: 234
-- Name: meal_order_blocks_id_seq; Type: SEQUENCE SET; Schema: cultural; Owner: admin
--

SELECT pg_catalog.setval('cultural.meal_order_blocks_id_seq', 8, true);


--
-- TOC entry 3595 (class 0 OID 0)
-- Dependencies: 236
-- Name: meal_order_flats_id_seq; Type: SEQUENCE SET; Schema: cultural; Owner: admin
--

SELECT pg_catalog.setval('cultural.meal_order_flats_id_seq', 140, true);


--
-- TOC entry 3596 (class 0 OID 0)
-- Dependencies: 232
-- Name: meal_order_items_id_seq; Type: SEQUENCE SET; Schema: cultural; Owner: admin
--

SELECT pg_catalog.setval('cultural.meal_order_items_id_seq', 27, true);


--
-- TOC entry 3597 (class 0 OID 0)
-- Dependencies: 230
-- Name: meal_orders_id_seq; Type: SEQUENCE SET; Schema: cultural; Owner: admin
--

SELECT pg_catalog.setval('cultural.meal_orders_id_seq', 3, true);


-- Completed on 2026-10-09 22:33:03

--
-- PostgreSQL database dump complete
--

\unrestrict oGfjxYqg7NKtoNLVACW7vIJOcmFptuz0nFWhuyMWkWraflNHrapcteemxadKeZD

