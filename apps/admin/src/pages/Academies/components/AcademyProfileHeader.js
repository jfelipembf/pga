import React, { useState } from "react";
import { Badge, Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from "reactstrap";
import PropTypes from "prop-types";

const AcademyProfileHeader = ({
    profile,
    tenantBranches,
    onSelectBranch,
    onNewBranch,
    currentBranchId,
    isCreatingNew,
    onPhotoChange,
    submitting,
    activeTab,
    setActiveTab,
    tabs
}) => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const toggleDropdown = () => setDropdownOpen(!dropdownOpen);

    if (!profile) return null;

    return (
        <div
            className="academy-profile__hero"
            style={{
                backgroundImage: `linear-gradient(90deg, rgba(0, 0, 0, 0.55) 0%, rgba(0, 0, 0, 0.2) 60%), url(${profile.cover})`,
            }}
        >
            <div className="academy-profile__content">
                <div className="d-flex align-items-center justify-content-between w-100">
                    <div className="d-flex align-items-center gap-3">
                        <div className="academy-profile__avatar-wrapper">
                            <div
                                className="academy-profile__avatar"
                                style={{
                                    backgroundImage: profile.photo ? `url(${profile.photo})` : 'none',
                                    position: 'relative'
                                }}
                            >
                                {submitting && (
                                    <div style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        height: '100%',
                                        backgroundColor: 'rgba(0,0,0,0.5)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        borderRadius: '50%'
                                    }}>
                                        <i className="bx bx-loader bx-spin text-white fs-1" />
                                    </div>
                                )}
                                {!profile.photo && !submitting && <i className="mdi mdi-domain text-secondary d-flex justify-content-center align-items-center h-100 fs-1"></i>}
                            </div>
                            <label htmlFor="clientAvatar" className="academy-profile__camera">
                                <i className="mdi mdi-camera" />
                            </label>
                            <input
                                type="file"
                                id="clientAvatar"
                                accept="image/*"
                                style={{ display: "none" }}
                                onChange={onPhotoChange}
                                disabled={submitting}
                            />
                        </div>
                        <div className="text-white">
                            <h3 className="mb-1 text-white">{profile.name}</h3>
                            <div className="d-flex align-items-center gap-2 flex-wrap">
                                <span className="fw-semibold opacity-75">ID: {profile.id}</span>
                                <Badge color={profile.statusColor} pill className="px-3 py-2">
                                    {profile.status}
                                </Badge>
                            </div>
                        </div>
                    </div>

                    <Dropdown isOpen={dropdownOpen} toggle={toggleDropdown}>
                        <DropdownToggle color="light" caret className="px-4">
                            <i className="mdi mdi-office-building-cog me-2" />
                            Gerenciar Unidades
                        </DropdownToggle>
                        <DropdownMenu end className="shadow border-0">
                            <DropdownItem header>Suas Unidades</DropdownItem>
                            {tenantBranches.map(branch => (
                                <DropdownItem
                                    key={branch.id}
                                    active={branch.id === currentBranchId && !isCreatingNew}
                                    onClick={() => onSelectBranch(branch.id)}
                                >
                                    <i className="mdi mdi-check-circle-outline me-2 text-success" />
                                    {branch.name.includes(" - ") ? branch.name.split(" - ").slice(1).join(" - ") : branch.name}
                                </DropdownItem>
                            ))}
                            <DropdownItem divider />
                            <DropdownItem onClick={onNewBranch} className="text-primary fw-bold">
                                <i className="mdi mdi-plus-circle me-2" />
                                Nova Filial
                            </DropdownItem>
                        </DropdownMenu>
                    </Dropdown>
                </div>
            </div>

            <div className="academy-profile__tabs">
                {tabs.map(tab => (
                    <button
                        key={tab}
                        type="button"
                        className={`academy-profile__tab ${activeTab === tab ? "academy-profile__tab--active" : ""}`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab}
                    </button>
                ))}
            </div>
        </div>
    );
};

AcademyProfileHeader.propTypes = {
    profile: PropTypes.object,
    tenantBranches: PropTypes.array,
    onSelectBranch: PropTypes.func,
    onNewBranch: PropTypes.func,
    currentBranchId: PropTypes.string,
    isCreatingNew: PropTypes.bool,
    onPhotoChange: PropTypes.func,
    submitting: PropTypes.bool,
    activeTab: PropTypes.string,
    setActiveTab: PropTypes.func,
    tabs: PropTypes.array
};

export default AcademyProfileHeader;
