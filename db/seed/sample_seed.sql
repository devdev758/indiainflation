INSERT INTO items (name, slug) VALUES
    ('Rice', 'rice')
    ON CONFLICT (slug) DO NOTHING;

INSERT INTO items (name, slug) VALUES
    ('Milk', 'milk')
    ON CONFLICT (slug) DO NOTHING;

INSERT INTO regions (name, slug) VALUES
    ('All India', 'all-india')
    ON CONFLICT (slug) DO NOTHING;

INSERT INTO series (item_id, region_id, date, value)
SELECT items.id, regions.id, dates.date, values_tbl.value
FROM (VALUES
    ('Rice', '2023-01-01', 140.2),
    ('Rice', '2023-02-01', 141.5),
    ('Milk', '2023-01-01', 132.0),
    ('Milk', '2023-02-01', 132.7)
) AS values_tbl(item_name, date, value)
JOIN items ON items.name = values_tbl.item_name
JOIN regions ON regions.slug = 'all-india'
JOIN LATERAL (SELECT values_tbl.date::DATE) AS dates(date) ON TRUE
ON CONFLICT (item_id, region_id, date) DO NOTHING;
